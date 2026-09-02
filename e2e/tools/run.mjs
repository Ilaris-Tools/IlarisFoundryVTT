import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveRuntimeMode } from '../../scripts/testing/e2e-runtime.js'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function loadLocalEnvironment() {
    const envPath = join(repositoryRoot, 'e2e', '.env')
    if (!existsSync(envPath)) return

    for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const separatorIndex = line.indexOf('=')
        if (separatorIndex < 1) continue
        const key = line.slice(0, separatorIndex).trim()
        const value = line
            .slice(separatorIndex + 1)
            .trim()
            .replace(/^['"]|['"]$/g, '')
        if (process.env[key] === undefined) process.env[key] = value
    }
}

function waitForExit(childProcess, name) {
    return new Promise((resolvePromise, reject) => {
        childProcess.on('error', reject)
        childProcess.on('close', (code) => {
            if (code === 0) return resolvePromise()
            reject(new Error(`${name} exited with code ${code}.`))
        })
    })
}

async function runPlaywright(environment, testPaths) {
    const cliPath = join(repositoryRoot, 'node_modules', '@playwright', 'test', 'cli.js')
    const childProcess = spawn(
        process.execPath,
        [cliPath, 'test', ...(testPaths.length > 0 ? testPaths : ['e2e/cases'])],
        { cwd: repositoryRoot, env: environment, stdio: 'inherit' },
    )
    await waitForExit(childProcess, 'Playwright')
}

loadLocalEnvironment()
resolveRuntimeMode()
await runPlaywright(process.env, process.argv.slice(2))
