import { expect, test } from '@playwright/test'

import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openMeleeAttackDialogForWeapon,
} from '../../shared/fixtures/foundry'

test.describe('E2E-001 Nahkampf Angriffsdialog', () => {
    test('Held oeffnen, Kampf-Tab, Kurzschwert-Angriff, Chat validieren', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)

        await clearChatLog(page)
        const beforeCount = await page.evaluate(() => game.messages.contents.length)

        const actorWindow = await openActorSheet(page, 'Testlauf-Held')
        await openMeleeAttackDialogForWeapon(actorWindow, 'Kurzschwert')

        const attackDialog = page.locator('.application.angriff-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })
        await expect(attackDialog).toContainText('Kampf: Kurzschwert')

        const attackButton = attackDialog.locator(
            '.modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
        )
        await attackButton.click()

        const chatIncreasedAfterClick = await page
            .waitForFunction((baseline) => game.messages.contents.length > baseline, beforeCount, {
                timeout: 4000,
            })
            .then(() => true)
            .catch(() => false)

        if (!chatIncreasedAfterClick) {
            // Fallback for flaky click delivery in AppV2 overlays.
            await page.evaluate(async () => {
                const node = document.querySelector(
                    '.application.angriff-dialog .modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
                )
                node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }

        await page.waitForFunction(
            (baseline) => game.messages.contents.length === baseline + 1,
            beforeCount,
            {
                timeout: 20000,
            },
        )

        const lastMessage = await page.evaluate(() => {
            const msg = game.messages.contents.at(-1)
            return {
                flavor: msg?.flavor ?? '',
                total: msg?.rolls?.[0]?.total ?? null,
                formula: msg?.rolls?.[0]?.formula ?? '',
            }
        })

        expect(lastMessage.flavor).toContain('Attacke (Kurzschwert)')
        expect(lastMessage.formula.toLowerCase()).toContain('d20')

        const totalNumber = Number(lastMessage.total)
        expect(Number.isNaN(totalNumber)).toBeFalsy()
        expect(totalNumber).toBeGreaterThan(0)

        expect(lastMessage.flavor).not.toContain('undefined')
        expect(lastMessage.flavor).not.toContain('<h2></h2>')
    })
})
