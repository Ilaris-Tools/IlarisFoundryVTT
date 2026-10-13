function isEnabled(value) {
    return ['1', 'true'].includes(String(value ?? '').toLowerCase())
}

export function resolvePlaywrightBrowserConfig(
    environment = process.env,
    platform = process.platform,
) {
    const executablePath = environment.E2E_CHROMIUM_PATH?.trim() || undefined
    return {
        headless: isEnabled(environment.E2E_CI_HEADLESS) || isEnabled(environment.E2E_HEADLESS),
        ...(executablePath
            ? { executablePath }
            : {
                  channel:
                      environment.PLAYWRIGHT_CHROMIUM_CHANNEL ??
                      (platform === 'win32' ? 'msedge' : 'chrome'),
              }),
    }
}
