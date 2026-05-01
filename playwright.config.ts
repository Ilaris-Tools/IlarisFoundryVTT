import { defineConfig, devices } from '@playwright/test'

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
        headless: false,
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
            use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
        },
    ],
})
