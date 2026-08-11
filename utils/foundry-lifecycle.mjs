#!/usr/bin/env node

// Cross-platform Foundry lifecycle helper for local E2E validation.
import { spawn, spawnSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, rmdirSync, statSync, unlinkSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const options = parseOptions(process.argv.slice(2))
function parseOptions(args) {
    const options = { action: args[0] || 'Status', world: 'ilaris-e2e-world-v14363-r1', port: 30000, timeout: 60 }
    for (let index = 1; index < args.length; index += 1) {
        const option = args[index]
        const value = args[index + 1]
        if (option === '--world') options.world = value
        if (option === '--port') options.port = Number(value)
        if (option === '--timeout') options.timeout = Number(value)
        if (option.startsWith('--')) index += 1
    }
    if (!['Status', 'Stop', 'Pack', 'Start', 'Restart', 'PackAndRestart'].includes(options.action)) {
        throw new Error(`Unknown action '${options.action}'.`)
    }
    if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
        throw new Error('Port must be an integer between 1 and 65535.')
    }
    if (!Number.isInteger(options.timeout) || options.timeout < 1 || options.timeout > 120) {
        throw new Error('Timeout must be an integer between 1 and 120 seconds.')
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(options.world)) {
        throw new Error('World identifiers may only contain letters, numbers, underscores, and hyphens.')
    }
    return options
}

function commandForPlatform(command, args) {
    if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
        return { command: 'cmd.exe', args: ['/d', '/s', '/c', command, ...args] }
    }
    return { command, args }
}

function commandOutput(command, args) {
    const platformCommand = commandForPlatform(command, args)
    const result = spawnSync(platformCommand.command, platformCommand.args, { encoding: 'utf8' })
    return result.status === 0 ? result.stdout : ''
}

function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function getListenerPids(port) {
    if (process.platform === 'win32') {
        const powershellPids = commandOutput('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            `Get-NetTCPConnection -State Listen -LocalPort ${port} | Select-Object -ExpandProperty OwningProcess`,
        ])
            .split(/\s+/)
            .map(Number)
            .filter(Boolean)
        if (powershellPids.length) return powershellPids
        return commandOutput('netstat', ['-ano', '-p', 'tcp'])
            .split(/\r?\n/)
            .filter((line) => line.includes(`:${port}`) && /LISTENING|ABHÖREN/i.test(line))
            .map((line) => Number(line.trim().split(/\s+/).at(-1)))
            .filter(Boolean)
    }
    return commandOutput('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'])
        .split(/\s+/)
        .map(Number)
        .filter(Boolean)
}

function testFoundryReady() {
    return new Promise((resolve) => {
        const request = http.get({ host: '127.0.0.1', port: options.port, path: '/', timeout: 1000 }, (response) => {
            response.resume()
            resolve(true)
        })
        request.on('timeout', () => request.destroy())
        request.on('error', () => resolve(false))
    })
}

async function waitFoundryReady() {
    const deadline = Date.now() + options.timeout * 1000
    while (Date.now() < deadline) {
        if (await testFoundryReady()) {
            console.log(`Foundry is ready on http://127.0.0.1:${options.port} (world: ${options.world}).`)
            return
        }
        await wait(1000)
    }
    throw new Error(`Foundry did not become ready on port ${options.port} within ${options.timeout} seconds.`)
}

async function stopFoundry() {
    const pids = getListenerPids(options.port)
    if (!pids.length) {
        if (await testFoundryReady()) {
            throw new Error(`Foundry is reachable on port ${options.port}, but its listener PID could not be identified. Install lsof or stop Foundry manually.`)
        }
        console.log(`No process is listening on port ${options.port}.`)
        return
    }
    for (const pid of pids) {
        console.log(`Stopping PID ${pid} on port ${options.port}.`)
        try {
            process.kill(pid, 'SIGTERM')
        } catch (error) {
            if (error.code !== 'ESRCH') throw error
        }
    }
    const deadline = Date.now() + 15000
    while (Date.now() < deadline) {
        if (!getListenerPids(options.port).length) {
            console.log('Waiting for Foundry to finish shutting down.')
            await wait(3000)
            removeStaleFoundryLock()
            return
        }
        await wait(250)
    }
    throw new Error(`The listener on port ${options.port} did not stop.`)
}

async function runPackAll() {
    if (getListenerPids(options.port).length || await testFoundryReady()) {
        throw new Error(`Foundry is still listening on port ${options.port}. Stop it before running pack-all.`)
    }
    console.log('Running npm run pack-all...')
    const platformCommand = commandForPlatform(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'pack-all'])
    const result = spawnSync(platformCommand.command, platformCommand.args, {
        cwd: projectRoot,
        stdio: 'inherit',
    })
    if (result.status !== 0) throw new Error(`pack-all failed with exit code ${result.status}.`)
}

function removeStaleFoundryLock() {
    const platformCommand = commandForPlatform(process.platform === 'win32' ? 'fvtt.cmd' : 'fvtt', [
        'configure', 'get', 'dataPath',
    ])
    const result = spawnSync(platformCommand.command, platformCommand.args, { encoding: 'utf8' })
    const dataPath = result.status === 0 ? result.stdout.trim() : ''
    if (!dataPath) {
        console.warn('Could not determine the Foundry data directory; leaving any lock file untouched.')
        return
    }
    const lockPath = path.join(dataPath, 'Config', 'options.json.lock')
    if (existsSync(lockPath)) {
        console.log(`Removing stale Foundry lock at ${lockPath}.`)
        if (statSync(lockPath).isDirectory()) rmdirSync(lockPath)
        else unlinkSync(lockPath)
    }
}

function assertFoundryCliAvailable() {
    const platformCommand = commandForPlatform(process.platform === 'win32' ? 'fvtt.cmd' : 'fvtt', ['--version'])
    const result = spawnSync(platformCommand.command, platformCommand.args, { encoding: 'utf8' })
    if (result.error?.code === 'ENOENT') {
        throw new Error('The Foundry CLI was not found. Install and configure @foundryvtt/foundryvtt-cli first.')
    }
    if (result.status !== 0) {
        throw new Error('The Foundry CLI is not ready. Run `fvtt configure` before starting Foundry.')
    }
}

async function startFoundry() {
    if (await testFoundryReady()) {
        console.log(`Foundry is already ready on port ${options.port}.`)
        return
    }
    assertFoundryCliAvailable()
    removeStaleFoundryLock()
    const worldPath = path.resolve(projectRoot, '..', '..', 'worlds', options.world)
    if (!existsSync(worldPath)) {
        throw new Error(`The configured world '${options.world}' was not found at ${worldPath}.`)
    }
    const logDirectory = path.join(projectRoot, '.codex', 'logs')
    mkdirSync(logDirectory, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const stdout = openSync(path.join(logDirectory, `foundry-${timestamp}.out.log`), 'a')
    const stderr = openSync(path.join(logDirectory, `foundry-${timestamp}.err.log`), 'a')
    console.log(`Launching Foundry world '${options.world}' on port ${options.port}.`)
    const platformCommand = commandForPlatform(process.platform === 'win32' ? 'fvtt.cmd' : 'fvtt', [
        'launch', '--world', options.world, '--port', String(options.port), '--noupnp',
    ])
    const child = spawn(platformCommand.command, platformCommand.args, {
        cwd: projectRoot,
        detached: true,
        stdio: ['ignore', stdout, stderr],
    })
    closeSync(stdout)
    closeSync(stderr)
    child.unref()
    await waitFoundryReady()
}

switch (options.action) {
    case 'Status':
        if (await testFoundryReady()) console.log(`Foundry is ready on http://127.0.0.1:${options.port}.`)
        else {
            console.log(`Foundry is not reachable on http://127.0.0.1:${options.port}.`)
            process.exitCode = 1
        }
        break
    case 'Stop':
        await stopFoundry()
        break
    case 'Pack':
        await runPackAll()
        break
    case 'Start':
        await startFoundry()
        break
    case 'Restart':
        await stopFoundry()
        await startFoundry()
        break
    case 'PackAndRestart':
        await stopFoundry()
        await runPackAll()
        await startFoundry()
        break
}
