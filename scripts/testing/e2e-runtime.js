const RUNTIME_MODE_ERROR =
    'Set E2E_FOUNDRY_URL to the running, dedicated Ilaris E2E Foundry server.'

function getConfiguredValue(environment, key) {
    const value = environment[key]?.trim()
    return value || undefined
}

export function resolveRuntimeMode(environment = process.env) {
    const url = getConfiguredValue(environment, 'E2E_FOUNDRY_URL')

    if (!url) throw new Error(RUNTIME_MODE_ERROR)

    let parsedUrl
    try {
        parsedUrl = new URL(url)
    } catch {
        throw new Error('E2E_FOUNDRY_URL must be an absolute HTTP(S) URL.')
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('E2E_FOUNDRY_URL must be an absolute HTTP(S) URL.')
    }

    return { type: 'external', url }
}
