import { resolveRuntimeMode } from '../e2e-runtime.js'

describe('resolveRuntimeMode', () => {
    test('requires the dedicated external server URL', () => {
        expect(() => resolveRuntimeMode({})).toThrow(
            'Set E2E_FOUNDRY_URL to the running, dedicated Ilaris E2E Foundry server.',
        )
    })

    test('selects external server mode', () => {
        expect(resolveRuntimeMode({ E2E_FOUNDRY_URL: 'http://localhost:30001' })).toEqual({
            type: 'external',
            url: 'http://localhost:30001',
        })
    })

    test('rejects an invalid external URL', () => {
        expect(() => resolveRuntimeMode({ E2E_FOUNDRY_URL: 'not a url' })).toThrow(
            'E2E_FOUNDRY_URL must be an absolute HTTP(S) URL.',
        )
    })
})
