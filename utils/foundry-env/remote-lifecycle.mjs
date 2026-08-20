#!/usr/bin/env node
/**
 * Credential-gated, manifest-driven Foundry server for web agents and CI.
 *
 * This deliberately manages only the PID and data root it creates under
 * FOUNDRY_HOME. It never discovers or terminates arbitrary port listeners.
 */
import { spawn, spawnSync } from 'node:child_process'
import {
    closeSync,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync,
    rmSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs'
import { copyFile, mkdir, rename } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
    commandForPlatform,
    getMissingCredentials,
    isManagedRemoteHome,
    readBaselineManifest,
    resolveRemoteEnvironment,
    SOFT_SKIP_EXIT_CODE,
    verifyArchiveChecksum,
} from './runtime.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const defaultHome = path.join(os.homedir(), '.ilaris-foundry-e2e')
const defaults = { action: 'Setup', port: 30000, timeout: 60 }
const actions = new Set(['Setup', 'Start', 'Stop', 'Restart', 'Status', 'Logs', 'Reset', 'Share', 'Unshare'])

function optionValue(args, name, fallback) {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] ?? fallback : fallback
}

export function parseRemoteOptions(args, environment = process.env) {
    const action = args[0] ?? defaults.action
    if (!actions.has(action)) throw new Error(`Unknown remote Foundry action '${action}'.`)
    const port = Number(optionValue(args, '--port', environment.FOUNDRY_PORT ?? defaults.port))
    const timeout = Number(optionValue(args, '--timeout', defaults.timeout))
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port must be an integer between 1 and 65535.')
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120) throw new Error('Timeout must be an integer between 1 and 120 seconds.')
    return {
        action,
        port,
        timeout,
        home: path.resolve(optionValue(args, '--home', environment.FOUNDRY_HOME ?? defaultHome)),
        lines: Number(optionValue(args, '--lines', 50)),
    }
}

function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export function isReady(port) {
    return new Promise((resolve) => {
        const request = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1000 }, (response) => {
            response.resume()
            resolve(true)
        })
        request.on('error', () => resolve(false))
        request.on('timeout', () => {
            request.destroy()
            resolve(false)
        })
    })
}

async function waitReady(port, timeout) {
    const deadline = Date.now() + timeout * 1000
    while (Date.now() < deadline) {
        if (await isReady(port)) return
        await wait(1000)
    }
    throw new Error(`Foundry did not become ready on port ${port} within ${timeout} seconds.`)
}

function extractZip(zip, destination) {
    if (process.platform === 'win32') {
        const command = `Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`
        return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { stdio: 'inherit' })
    }
    return spawnSync('unzip', ['-oq', zip, '-d', destination], { stdio: 'inherit' })
}

async function downloadToFile(url, destination) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Baseline download failed: HTTP ${response.status}.`)
    const { pipeline } = await import('node:stream/promises')
    const { Readable } = await import('node:stream')
    const { createWriteStream } = await import('node:fs')
    const partial = `${destination}.partial`
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial))
    await rename(partial, destination)
}

async function cacheBaseline(manifest, cache) {
    const archive = path.join(cache, manifest.archive)
    if (existsSync(archive)) return archive
    await mkdir(cache, { recursive: true })
    const repositoryArchive = path.join(root, 'e2e', 'fixtures', 'baselines', manifest.archive)
    if (existsSync(repositoryArchive)) await copyFile(repositoryArchive, archive)
    else await downloadToFile(manifest.releaseAsset, archive)
    return archive
}

function findMain(appDirectory) {
    for (const candidate of ['main.mjs', 'main.js', 'resources/app/main.mjs', 'resources/app/main.js']) {
        const resolved = path.join(appDirectory, candidate)
        if (existsSync(resolved)) return resolved
    }
    throw new Error(`Could not find a Foundry entry point under ${appDirectory}.`)
}

async function prepareApplication(home, environment, version) {
    const appDirectory = path.join(home, 'app')
    const marker = path.join(appDirectory, '.installed-version')
    if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === String(version)) return findMain(appDirectory)
    const release = path.join(home, 'cache', `foundryvtt-${version}.zip`)
    const result = spawnSync(process.execPath, [path.join(root, 'utils/foundry-env/download-foundry.mjs'), version, release], {
        cwd: root,
        env: environment,
        stdio: 'inherit',
    })
    if (result.status !== 0) throw new Error(`Foundry application download failed with exit code ${result.status}.`)
    rmSync(appDirectory, { recursive: true, force: true })
    mkdirSync(appDirectory, { recursive: true })
    const extraction = extractZip(release, appDirectory)
    if (extraction.error?.code === 'ENOENT') throw new Error('Could not extract Foundry: install unzip or use Windows PowerShell.')
    if (extraction.status !== 0) throw new Error('Could not extract the Foundry application archive.')
    writeFileSync(marker, String(version))
    return findMain(appDirectory)
}

function ensureCompendiumPacks() {
    if (existsSync(path.join(root, 'comp_packs', 'waffen', 'CURRENT'))) return
    const invocation = commandForPlatform(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'pack-all'])
    const result = spawnSync(invocation.command, invocation.args, { cwd: root, stdio: 'inherit' })
    if (result.status !== 0) throw new Error(`pack-all failed with exit code ${result.status}.`)
}

function processIsRunning(pid) {
    if (!Number.isInteger(pid) || pid < 1) return false
    try {
        process.kill(pid, 0)
        return true
    } catch (error) {
        return error.code === 'EPERM'
    }
}

function readOwnedProcess(home, name = 'foundry') {
    const file = path.join(home, `${name}.pid`)
    if (!existsSync(file)) return undefined
    const pid = Number(readFileSync(file, 'utf8').trim())
    return Number.isInteger(pid) ? { file, pid } : undefined
}

export async function stopOwnedProcess(home, name = 'foundry') {
    const owned = readOwnedProcess(home, name)
    if (!owned) return false
    if (processIsRunning(owned.pid)) {
        process.kill(owned.pid, 'SIGTERM')
        const deadline = Date.now() + 15000
        while (processIsRunning(owned.pid) && Date.now() < deadline) await wait(250)
        if (processIsRunning(owned.pid)) throw new Error(`Managed ${name} PID ${owned.pid} did not stop.`)
    }
    unlinkSync(owned.file)
    return true
}

function writeServerConfig(dataRoot, port, manifest, environment) {
    mkdirSync(path.join(dataRoot, 'Config'), { recursive: true })
    writeFileSync(
        path.join(dataRoot, 'Config', 'license.json'),
        JSON.stringify({ license: String(environment.FOUNDRY_LICENSE_KEY).replace(/[^A-Za-z0-9]/g, '') }),
    )
    writeFileSync(
        path.join(dataRoot, 'Config', 'options.json'),
        JSON.stringify({ port, upnp: false, world: manifest.worldId, language: 'en.core' }, null, 2),
    )
}

export async function setupRemote({
    environment = process.env,
    home = environment.FOUNDRY_HOME ?? defaultHome,
    port = Number(environment.FOUNDRY_PORT ?? defaults.port),
    allowSecretsFile = true,
} = {}) {
    const secretPath = environment.FOUNDRY_SECRETS_FILE ?? path.join(os.homedir(), '.foundry-env')
    const resolvedEnvironment = resolveRemoteEnvironment(
        environment,
        allowSecretsFile && existsSync(secretPath) ? readFileSync(secretPath, 'utf8') : '',
    )
    const missing = getMissingCredentials(resolvedEnvironment)
    if (missing.length) return { exitCode: SOFT_SKIP_EXIT_CODE, message: `Missing ${missing.join('; ')}. Configure them in the process environment or ${secretPath}.` }

    const manifest = await readBaselineManifest(path.join(root, 'e2e', 'fixtures', 'baselines', 'manifest.json'))
    const resolvedHome = path.resolve(home)
    const archive = await cacheBaseline(manifest, path.join(resolvedHome, 'cache'))
    verifyArchiveChecksum(archive, manifest.sha256)

    const dataRoot = path.join(resolvedHome, 'data')
    const worldsDirectory = path.join(dataRoot, 'Data', 'worlds')
    const worldDirectory = path.join(worldsDirectory, manifest.worldDirectory)
    if (!existsSync(path.join(worldDirectory, 'world.json'))) {
        mkdirSync(worldsDirectory, { recursive: true })
        const result = extractZip(archive, worldsDirectory)
        if (result.error?.code === 'ENOENT') throw new Error('Could not extract baseline: install unzip or use Windows PowerShell.')
        if (result.status !== 0) throw new Error('Could not extract the verified E2E baseline archive.')
    }

    const systemLink = path.join(dataRoot, 'Data', 'systems', manifest.systemId)
    mkdirSync(path.dirname(systemLink), { recursive: true })
    ensureCompendiumPacks()
    if (!existsSync(systemLink)) symlinkSync(root, systemLink, process.platform === 'win32' ? 'junction' : 'dir')
    writeServerConfig(dataRoot, port, manifest, resolvedEnvironment)
    writeFileSync(path.join(resolvedHome, 'remote.json'), JSON.stringify({ port, world: manifest.worldId, dataRoot }, null, 2))
    return { exitCode: 0, message: `Prepared ${manifest.worldId} at ${resolvedHome}.`, manifest, environment: resolvedEnvironment, home: resolvedHome, dataRoot }
}

export async function startRemote(options = {}) {
    const setup = await setupRemote(options)
    if (setup.exitCode) return setup
    const remote = JSON.parse(readFileSync(path.join(setup.home, 'remote.json'), 'utf8'))
    if (await isReady(remote.port)) return { exitCode: 0, message: `Foundry is already ready on http://127.0.0.1:${remote.port}.` }
    const prior = readOwnedProcess(setup.home)
    if (prior?.pid && processIsRunning(prior.pid)) throw new Error(`Managed Foundry PID ${prior.pid} is running but not ready; inspect ${path.join(setup.home, 'foundry.log')}.`)
    if (prior) unlinkSync(prior.file)
    const main = await prepareApplication(setup.home, setup.environment, setup.manifest.foundryVersion)
    const log = path.join(setup.home, 'foundry.log')
    const descriptor = openSync(log, 'a')
    const child = spawn(process.execPath, [main, `--dataPath=${remote.dataRoot}`, `--port=${remote.port}`, '--noupnp'], {
        detached: true,
        stdio: ['ignore', descriptor, descriptor],
        env: setup.environment,
    })
    let launchError
    child.once('error', (error) => {
        launchError = error
    })
    closeSync(descriptor)
    await wait(25)
    if (launchError) throw new Error(`Could not launch Foundry: ${launchError.message}`)
    child.unref()
    writeFileSync(path.join(setup.home, 'foundry.pid'), String(child.pid))
    await waitReady(remote.port, Number(options.timeout ?? defaults.timeout))
    return { exitCode: 0, message: `Foundry is ready on http://127.0.0.1:${remote.port} (world: ${setup.manifest.worldId}).` }
}

function logTail(home, lines) {
    const log = path.join(home, 'foundry.log')
    if (!existsSync(log)) return `No remote Foundry log exists at ${log}.`
    return readFileSync(log, 'utf8').split(/\r?\n/).slice(-Math.max(1, lines)).join('\n')
}

async function shareRemote(home, port) {
    if (!(await isReady(port))) throw new Error(`Foundry is not running on port ${port}; start it before sharing.`)
    console.warn('SECURITY WARNING: this test server has an unauthenticated GM. Anyone with the public URL can join as GM.')
    const existing = readOwnedProcess(home, 'tunnel')
    const log = path.join(home, 'tunnel.log')
    if (existing && processIsRunning(existing.pid)) return { exitCode: 0, message: `Tunnel is already running. ${logTail(home, 20)}` }
    const command = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared'
    const descriptor = openSync(log, 'w')
    const child = spawn(command, ['tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate', '--protocol', 'http2'], { detached: true, stdio: ['ignore', descriptor, descriptor] })
    closeSync(descriptor)
    let launchError
    child.once('error', (error) => {
        launchError = error
    })
    await wait(25)
    if (launchError) throw new Error(`Could not start cloudflared: ${launchError.message}`)
    if (child.pid === undefined) throw new Error('Could not start cloudflared. Install cloudflared and retry.')
    child.unref()
    writeFileSync(path.join(home, 'tunnel.pid'), String(child.pid))
    await wait(1000)
    if (!processIsRunning(child.pid)) throw new Error(`cloudflared stopped immediately. ${logTail(home, 20)}`)
    return { exitCode: 0, message: `Tunnel started. ${logTail(home, 20)}` }
}

async function resetRemote(home) {
    if (!isManagedRemoteHome(home, defaultHome)) {
        throw new Error(`Refusing to reset '${home}': only the default managed remote home '${defaultHome}' may be deleted.`)
    }
    await stopOwnedProcess(home, 'tunnel')
    await stopOwnedProcess(home, 'foundry')
    rmSync(home, { recursive: true, force: true })
    return { exitCode: 0, message: `Removed managed remote environment at ${home}.` }
}

export async function runRemoteLifecycle(options) {
    const { action, home, port, timeout, lines } = options
    if (action === 'Setup') return setupRemote({ home, port })
    if (action === 'Start') return startRemote({ home, port, timeout })
    if (action === 'Stop') return { exitCode: 0, message: (await stopOwnedProcess(home)) ? 'Stopped managed remote Foundry.' : 'Managed remote Foundry is not running.' }
    if (action === 'Restart') {
        await stopOwnedProcess(home)
        return startRemote({ home, port, timeout })
    }
    if (action === 'Status') return { exitCode: (await isReady(port)) ? 0 : 1, message: (await isReady(port)) ? `Foundry is ready on http://127.0.0.1:${port}.` : `Foundry is not reachable on http://127.0.0.1:${port}.` }
    if (action === 'Logs') return { exitCode: 0, message: logTail(home, lines) }
    if (action === 'Reset') return resetRemote(home)
    if (action === 'Share') return shareRemote(home, port)
    return { exitCode: 0, message: (await stopOwnedProcess(home, 'tunnel')) ? 'Tunnel stopped; the public URL is no longer available.' : 'No managed tunnel is running.' }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const result = await runRemoteLifecycle(parseRemoteOptions(process.argv.slice(2)))
        console.log(result.message)
        process.exitCode = result.exitCode
    } catch (error) {
        console.error(`[foundry:remote] ${error.message}`)
        process.exitCode = 1
    }
}
