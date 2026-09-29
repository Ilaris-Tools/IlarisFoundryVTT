import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
export const SOFT_SKIP_EXIT_CODE = 3

export function parseEnvironmentFile(text) {
    const values = {}
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const separator = line.indexOf('=')
        if (separator < 1) continue
        const key = line.slice(0, separator).trim()
        if (!/^(FOUNDRY|E2E)_/.test(key)) continue
        values[key] = line
            .slice(separator + 1)
            .trim()
            .replace(/^['"]|['"]$/g, '')
    }
    return values
}

export function resolveRemoteEnvironment(environment = process.env, secretsText = '') {
    const fileValues = parseEnvironmentFile(secretsText)
    return {
        ...fileValues,
        ...Object.fromEntries(Object.entries(environment).filter(([, value]) => value)),
    }
}

export function getMissingCredentials(environment) {
    const missing = []
    if (!environment.FOUNDRY_LICENSE_KEY) missing.push('FOUNDRY_LICENSE_KEY')
    if (
        !environment.FOUNDRY_DOWNLOAD_URL &&
        !(environment.FOUNDRY_USERNAME && environment.FOUNDRY_PASSWORD)
    ) {
        missing.push('FOUNDRY_DOWNLOAD_URL or FOUNDRY_USERNAME + FOUNDRY_PASSWORD')
    }
    return missing
}

export async function readBaselineManifest(
    manifestPath = resolve('e2e/fixtures/baselines/manifest.json'),
) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    for (const key of [
        'archive',
        'sha256',
        'worldDirectory',
        'worldId',
        'systemId',
        'foundryVersion',
        'releaseAsset',
        'requiredUsers',
        'requiredActors',
    ]) {
        if (!manifest[key]) throw new Error(`E2E baseline manifest is missing '${key}'.`)
    }
    if (manifest.worldId === 'vanilla-ilaris' || manifest.worldDirectory === 'vanilla-ilaris') {
        throw new Error(
            'Remote E2E provisioning must use the published baseline, never vanilla-ilaris.',
        )
    }
    return manifest
}

export function isManagedRemoteHome(home, defaultHome) {
    return resolve(home) === resolve(defaultHome)
}

export function commandForPlatform(command, args, platform = process.platform) {
    if (platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
        return { command: 'cmd.exe', args: ['/d', '/s', '/c', command, ...args] }
    }
    return { command, args }
}

export function verifyArchiveChecksum(archivePath, expectedSha256) {
    if (!existsSync(archivePath)) throw new Error(`Baseline archive does not exist: ${archivePath}`)
    const actual = createHash('sha256')
        .update(readFileSync(archivePath))
        .digest('hex')
        .toUpperCase()
    if (actual !== String(expectedSha256).toUpperCase()) {
        throw new Error(
            `Baseline archive checksum mismatch: expected ${expectedSha256}, received ${actual}.`,
        )
    }
    return true
}
