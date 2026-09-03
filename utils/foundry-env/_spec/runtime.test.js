import {
    commandForPlatform,
    getMissingCredentials,
    isManagedRemoteHome,
    parseEnvironmentFile,
    readBaselineManifest,
    resolveRemoteEnvironment,
    verifyArchiveChecksum,
} from '../runtime.js'
import { deriveCloudRun, getMissingCloudCredentials } from '../cloud-bootstrap.js'
import { createHash } from 'node:crypto'
import { mkdtemp, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

describe('remote Foundry environment', () => {
    test('loads only supported variables from a developer-owned secrets file', () => {
        expect(
            parseEnvironmentFile('FOUNDRY_LICENSE_KEY=file-key\nIGNORE=value\nE2E_HEADLESS=1'),
        ).toEqual({
            FOUNDRY_LICENSE_KEY: 'file-key',
            E2E_HEADLESS: '1',
        })
    })

    test('process environment takes precedence over the secrets file', () => {
        expect(
            resolveRemoteEnvironment(
                { FOUNDRY_LICENSE_KEY: 'environment-key' },
                'FOUNDRY_LICENSE_KEY=file-key',
            ),
        ).toMatchObject({
            FOUNDRY_LICENSE_KEY: 'environment-key',
        })
    })

    test('reports a soft-skip credential prerequisite', () => {
        expect(getMissingCredentials({})).toEqual([
            'FOUNDRY_LICENSE_KEY',
            'FOUNDRY_DOWNLOAD_URL or FOUNDRY_USERNAME + FOUNDRY_PASSWORD',
        ])
    })

    test('requires cloud credentials from the supplied process environment', () => {
        expect(getMissingCloudCredentials({})).toEqual([
            'FOUNDRY_LICENSE_KEY',
            'FOUNDRY_DOWNLOAD_URL or FOUNDRY_USERNAME + FOUNDRY_PASSWORD',
        ])
        expect(
            getMissingCloudCredentials({
                FOUNDRY_LICENSE_KEY: 'injected',
                FOUNDRY_DOWNLOAD_URL: 'https://example.invalid/foundry.zip',
            }),
        ).toEqual([])
    })

    test('derives isolated managed homes and ports from distinct cloud run identities', () => {
        const root = path.join(os.tmpdir(), 'ilaris-cloud-runs')
        const first = deriveCloudRun({ FOUNDRY_RUN_ID: 'agent-a' }, root)
        const second = deriveCloudRun({ FOUNDRY_RUN_ID: 'agent-b' }, root)
        expect(first.home).toContain('agent-a')
        expect(second.home).toContain('agent-b')
        expect(first.port).not.toBe(second.port)
        expect(() => deriveCloudRun({ FOUNDRY_HOME: os.tmpdir() }, root)).toThrow(
            'must stay within the managed cloud root',
        )
    })

    test('requires canonical manifest identity and fields', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'ilaris-baseline-'))
        const manifestPath = path.join(directory, 'manifest.json')
        await writeFile(manifestPath, JSON.stringify({ worldId: 'vanilla-ilaris' }))
        await expect(readBaselineManifest(manifestPath)).rejects.toThrow("missing 'archive'")

        await writeFile(
            manifestPath,
            JSON.stringify({
                archive: 'world.zip',
                sha256: 'abc',
                worldDirectory: 'vanilla-ilaris',
                worldId: 'vanilla-ilaris',
                systemId: 'Ilaris',
                foundryVersion: '14.363',
                releaseAsset: 'https://example.invalid/world.zip',
                requiredUsers: ['e2e-gm'],
                requiredActors: ['HatAlles'],
            }),
        )
        await expect(readBaselineManifest(manifestPath)).rejects.toThrow('never vanilla-ilaris')
    })

    test('verifies archive checksums and scopes managed-home cleanup decisions', async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), 'ilaris-baseline-'))
        const archive = path.join(directory, 'world.zip')
        await writeFile(archive, 'baseline')
        const checksum = createHash('sha256').update('baseline').digest('hex')
        expect(verifyArchiveChecksum(archive, checksum)).toBe(true)
        expect(() => verifyArchiveChecksum(archive, '0'.repeat(64))).toThrow('checksum mismatch')
        expect(isManagedRemoteHome(directory, directory)).toBe(true)
        expect(isManagedRemoteHome(path.join(directory, 'other'), directory)).toBe(false)
    })

    test('selects a Windows command adapter without requiring a shell wrapper', () => {
        expect(commandForPlatform('npm.cmd', ['run', 'pack-all'], 'win32')).toEqual({
            command: 'cmd.exe',
            args: ['/d', '/s', '/c', 'npm.cmd', 'run', 'pack-all'],
        })
        expect(commandForPlatform('npm', ['run', 'pack-all'], 'linux')).toEqual({
            command: 'npm',
            args: ['run', 'pack-all'],
        })
    })
})
