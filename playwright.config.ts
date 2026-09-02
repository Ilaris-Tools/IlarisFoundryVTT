import { defineConfig, devices } from '@playwright/test'

const browserChannel =
    process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome')
const headless = ['1', 'true'].includes((process.env.E2E_CI_HEADLESS ?? '').toLowerCase())

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
        headless,
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
                channel: browserChannel,
                viewport: { width: 1366, height: 768 },
            },
        },
    ],
})
