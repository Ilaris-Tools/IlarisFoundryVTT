import { SOFT_SKIP_EXIT_CODE } from '../runtime.js'
import { runCloudBootstrap } from '../cloud-bootstrap.js'

const credentialedEnvironment = {
    FOUNDRY_LICENSE_KEY: 'injected-license',
    FOUNDRY_DOWNLOAD_URL: 'https://example.invalid/foundry.zip',
    FOUNDRY_RUN_ID: 'cloud-test',
}

describe('cloud Foundry bootstrap', () => {
    test('soft-skips before commands run when credentials are missing', async () => {
        const runCommand = jest.fn()
        const result = await runCloudBootstrap({ environment: {}, runCommand })
        expect(result.exitCode).toBe(SOFT_SKIP_EXIT_CODE)
        expect(runCommand).not.toHaveBeenCalled()
    })

    test('runs install, E2E test, and owned cleanup in order', async () => {
        const calls = []
        const runCommand = jest.fn(async (command, args, options) => {
            calls.push({ command, args, environment: options.environment })
            return 0
        })
        const start = jest.fn(async () => ({ exitCode: 0 }))
        const stop = jest.fn(async () => true)

        const result = await runCloudBootstrap({
            environment: credentialedEnvironment,
            testPaths: ['e2e/cases/e2e-001.spec.ts'],
            runCommand,
            start,
            stop,
        })

        expect(result.exitCode).toBe(0)
        expect(calls[0].args).toContain('ci')
        expect(calls[0].environment).not.toHaveProperty('FOUNDRY_LICENSE_KEY')
        expect(calls[0].environment).not.toHaveProperty('FOUNDRY_DOWNLOAD_URL')
        expect(calls[1].args).toEqual(
            expect.arrayContaining(['run', 'test:e2e', '--', 'e2e/cases/e2e-001.spec.ts']),
        )
        expect(calls[1].environment).toMatchObject({
            E2E_HEADLESS: 'true',
            E2E_FOUNDRY_URL: `http://127.0.0.1:${result.port}`,
        })
        expect(calls[1].environment).not.toHaveProperty('FOUNDRY_LICENSE_KEY')
        expect(start).toHaveBeenCalledWith(
            expect.objectContaining({
                allowSecretsFile: false,
                environment: credentialedEnvironment,
            }),
        )
        expect(stop).toHaveBeenCalledWith(result.home)
    })

    test('retains test artifacts and cleans up after a failed E2E command', async () => {
        const stop = jest.fn(async () => true)
        const runCommand = jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1)

        const result = await runCloudBootstrap({
            environment: credentialedEnvironment,
            runCommand,
            start: async () => ({ exitCode: 0 }),
            stop,
        })

        expect(result.exitCode).toBe(1)
        expect(stop).toHaveBeenCalledTimes(1)
    })
})
