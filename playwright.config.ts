import { defineConfig, devices } from '@playwright/test'
import { resolvePlaywrightBrowserConfig } from './scripts/testing/playwright-browser-config.js'

const browser = resolvePlaywrightBrowserConfig()

export default defineConfig({
    testDir: './e2e/cases',
    timeout: 90000,
    expect: {
        timeout: 15000,
    },
    fullyParallel: false,
    workers: 1,
    reporter: 'line',
    use: {
        headless: browser.headless,
        baseURL: process.env.E2E_FOUNDRY_URL ?? 'http://localhost:30000',
        viewport: { width: 1366, height: 768 },
        actionTimeout: 15000,
        navigationTimeout: 60000,
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                ...(browser.executablePath
                    ? { executablePath: browser.executablePath }
                    : { channel: browser.channel }),
                viewport: { width: 1366, height: 768 },
            },
        },
    ],
})
