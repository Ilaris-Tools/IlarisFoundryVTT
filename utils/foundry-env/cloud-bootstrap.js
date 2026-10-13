#!/usr/bin/env node
/**
 * Disposable cloud-VM Foundry E2E bootstrap.
 *
 * Credentials are intentionally read only from the inherited process
 * environment. Provider adapters supply them; this command never reads a
 * developer-home secrets file.
 */
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { commandForPlatform, getMissingCredentials, SOFT_SKIP_EXIT_CODE } from './runtime.js'

// Package scripts execute from the repository root; keeping this free of
// import.meta also lets the existing Jest/Babel setup load the pure helpers.
const projectRoot = path.resolve(process.cwd())
const defaultCloudRoot = path.join(os.tmpdir(), 'ilaris-foundry-cloud-runs')
const defaultPortBase = 20000
const defaultPortSpan = 20000

function sanitizeRunId(value) {
    const runId = String(value ?? `run-${process.pid}`)
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(runId)) {
        throw new Error(
            'FOUNDRY_RUN_ID may only contain letters, numbers, underscores, and hyphens.',
        )
    }
    return runId
}

function isWithinRoot(candidate, root) {
    const relative = path.relative(root, candidate)
    return (
        relative &&
        !relative.startsWith(`..${path.sep}`) &&
        relative !== '..' &&
        !path.isAbsolute(relative)
    )
}

function derivedPort(runId) {
    const hash = createHash('sha256').update(runId).digest()
    return defaultPortBase + (hash.readUInt16BE(0) % defaultPortSpan)
}

/**
 * Return cloud-only credential prerequisites without consulting a secrets file.
 */
export function getMissingCloudCredentials(environment = process.env) {
    return getMissingCredentials(environment)
}

/**
 * Resolve one isolated managed home and port from a cloud run identity.
 */
export function deriveCloudRun(
    environment = process.env,
    root = environment.FOUNDRY_CLOUD_ROOT ?? defaultCloudRoot,
) {
    const managedRoot = path.resolve(root)
    const runId = sanitizeRunId(environment.FOUNDRY_RUN_ID)
    const home = path.resolve(environment.FOUNDRY_HOME ?? path.join(managedRoot, runId))
    if (!isWithinRoot(home, managedRoot)) {
        throw new Error(`FOUNDRY_HOME must stay within the managed cloud root '${managedRoot}'.`)
    }

    const port = Number(environment.FOUNDRY_PORT ?? derivedPort(runId))
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
        throw new Error('FOUNDRY_PORT must be an integer between 1024 and 65535.')
    }

    return { home, managedRoot, port, runId }
}

export function parseCloudBootstrapOptions(args, environment = process.env) {
    const testPaths = []
    let skipInstall = environment.FOUNDRY_SKIP_NPM_CI === 'true'
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index]
        if (argument === '--skip-install') {
            skipInstall = true
            continue
        }
        if (argument === '--') {
            testPaths.push(...args.slice(index + 1))
            break
        }
        testPaths.push(argument)
    }
    return { skipInstall, testPaths }
}

function runChild(command, args, { environment = process.env } = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: projectRoot,
            env: environment,
            stdio: 'inherit',
        })
        child.once('error', reject)
        child.once('close', (code) => resolve(code ?? 1))
    })
}

function npmCommand() {
    return commandForPlatform(process.platform === 'win32' ? 'npm.cmd' : 'npm', [])
}

function withoutFoundryCredentials(environment) {
    const {
        FOUNDRY_LICENSE_KEY: _license,
        FOUNDRY_DOWNLOAD_URL: _downloadUrl,
        FOUNDRY_USERNAME: _username,
        FOUNDRY_PASSWORD: _password,
        ...safeEnvironment
    } = environment
    return safeEnvironment
}

/**
 * Execute the cloud-VM lifecycle. Dependency injection keeps its ordering and
 * cleanup behavior unit-testable without a Foundry installation.
 */
export async function runCloudBootstrap({
    environment = process.env,
    testPaths = [],
    skipInstall = false,
    runCommand = runChild,
    start,
    stop,
    cloudRoot,
} = {}) {
    const missing = getMissingCloudCredentials(environment)
    if (missing.length) {
        return {
            exitCode: SOFT_SKIP_EXIT_CODE,
            message: `Cloud Foundry bootstrap skipped: missing ${missing.join('; ')}.`,
        }
    }

    const { home, port } = deriveCloudRun(environment, cloudRoot)
    const npm = npmCommand()
    const lifecycle = start && stop ? undefined : await import('./remote-lifecycle.mjs')
    const startManagedFoundry = start ?? lifecycle.startRemote
    const stopManagedFoundry = stop ?? lifecycle.stopOwnedProcess
    let started = false
    let exitCode = 1

    try {
        if (!skipInstall) {
            const installCode = await runCommand(npm.command, [...npm.args, 'ci'], {
                environment: withoutFoundryCredentials(environment),
            })
            if (installCode !== 0) {
                return {
                    exitCode: installCode,
                    home,
                    port,
                    message: 'npm ci failed before Foundry startup.',
                }
            }
        }

        // Mark ownership before starting so a partial startup is cleaned up by
        // the remote lifecycle's recorded-PID guard in the finally path.
        started = true
        const startResult = await startManagedFoundry({
            environment,
            home,
            port,
            allowSecretsFile: false,
        })
        if (startResult.exitCode !== 0) return { ...startResult, home, port }
        const childEnvironment = {
            ...withoutFoundryCredentials(environment),
            E2E_FOUNDRY_URL: `http://127.0.0.1:${port}`,
            E2E_HEADLESS: 'true',
        }
        const paths = testPaths.length ? testPaths : ['e2e/cases']
        exitCode = await runCommand(npm.command, [...npm.args, 'run', 'test:e2e', '--', ...paths], {
            environment: childEnvironment,
        })
        return {
            exitCode,
            home,
            port,
            message:
                exitCode === 0
                    ? 'Cloud Foundry E2E bootstrap completed.'
                    : 'Cloud Foundry E2E tests failed; test-results were retained.',
        }
    } finally {
        if (started) await stopManagedFoundry(home)
    }
}

async function main() {
    try {
        const options = parseCloudBootstrapOptions(process.argv.slice(2))
        const result = await runCloudBootstrap(options)
        console.log(result.message)
        process.exitCode = result.exitCode
    } catch (error) {
        console.error(`[foundry:cloud] ${error.message}`)
        process.exitCode = 1
    }
}

if (/cloud-bootstrap\.js$/.test(process.argv[1] ?? '')) void main()
