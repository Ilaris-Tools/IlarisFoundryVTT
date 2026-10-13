import { resolvePlaywrightBrowserConfig } from '../playwright-browser-config.js'

describe('Playwright browser configuration', () => {
    test('keeps a headed local platform channel by default', () => {
        expect(resolvePlaywrightBrowserConfig({}, 'win32')).toEqual({
            headless: false,
            channel: 'msedge',
        })
        expect(resolvePlaywrightBrowserConfig({}, 'linux')).toEqual({
            headless: false,
            channel: 'chrome',
        })
    })

    test.each(['E2E_CI_HEADLESS', 'E2E_HEADLESS'])('enables headless mode through %s', (key) => {
        expect(resolvePlaywrightBrowserConfig({ [key]: 'true' })).toMatchObject({ headless: true })
    })

    test('uses an explicit Chromium binary without a conflicting channel', () => {
        expect(
            resolvePlaywrightBrowserConfig({
                E2E_CHROMIUM_PATH: '/opt/chromium',
                E2E_HEADLESS: '1',
            }),
        ).toEqual({
            headless: true,
            executablePath: '/opt/chromium',
        })
    })
})
