import { expect, test } from '@playwright/test'

import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

test.describe('E2E-032 Major release announcement', () => {
    test('shows the existing tutorial links once per major release', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        const previousAnnouncement = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'lastAnnouncedMajorRelease',
            '',
        )
        await clearChatLog(page)

        try {
            await page.reload({ waitUntil: 'domcontentloaded' })
            await page.waitForFunction(() => typeof game !== 'undefined' && game.ready)
            await page.waitForFunction(
                () =>
                    (game.messages?.contents ?? []).some((message: any) =>
                        message.content?.includes('Major-Release'),
                    ),
                undefined,
                { timeout: 30000 },
            )

            const firstCount = await page.evaluate(
                () =>
                    (game.messages?.contents ?? []).filter((message: any) =>
                        message.content?.includes('Major-Release'),
                    ).length,
            )
            expect(firstCount).toBe(1)

            await page.reload({ waitUntil: 'domcontentloaded' })
            await page.waitForFunction(() => typeof game !== 'undefined' && game.ready)
            const secondCount = await page.evaluate(
                () =>
                    (game.messages?.contents ?? []).filter((message: any) =>
                        message.content?.includes('Major-Release'),
                    ).length,
            )
            expect(secondCount).toBe(1)
        } finally {
            await restoreFoundrySetting(page, previousAnnouncement)
        }
    })
})
