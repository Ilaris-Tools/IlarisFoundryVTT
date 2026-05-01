import { expect, test } from '@playwright/test'

import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openMeleeAttackDialogForWeapon,
} from '../../shared/fixtures/foundry'

test.describe('E2E-005 Nahkampf-Angriffsdialog: Patzer, Triumph und Normalwurf', () => {
    test.afterEach(async ({ page }) => {
        // Sicherstellen, dass randomUniform nach dem Test zurueckgesetzt wird,
        // auch wenn der Test fehlschlaegt.
        await page
            .evaluate(() => {
                delete CONFIG.Dice.randomUniform
            })
            .catch(() => {})
    })

    test('Vier Wuerfe mit fixen randomUniform-Werten: 0.99 → Patzer, 0.01 → Triumph, 0.95 und 0.05 → Normalwurf', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        await clearChatLog(page)

        const actorWindow = await openActorSheet(page, 'Testlauf-Held')
        await openMeleeAttackDialogForWeapon(actorWindow, 'Kurzschwert')

        const attackDialog = page.locator('.application.angriff-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })
        await expect(attackDialog).toContainText('Kampf: Kurzschwert')

        const attackButton = attackDialog.locator(
            '.modifier-summary.attack-summary.clickable-summary.angreifen',
        )

        // Einstellung pruefen: 'Triumph' oder 'Crit' je nach renameTriumphWithCrit-Setting
        const triumphText = await page.evaluate(() =>
            game.settings.get('Ilaris', 'renameTriumphWithCrit') ? 'Crit' : 'Triumph',
        )

        const patzerText = 'Patzer' // Patzer-Text ist derzeit nicht konfigurierbar, daher hartkodiert in der Erwartung. Sollte er konfigurierbar werden, muss hier ggf. eine Abfrage wie bei triumphText erfolgen.

        /**
         * Klickt den Angreifen-Button und wartet auf genau eine neue Chat-Nachricht.
         * Gibt flavor und das rohe W20-Ergebnis zurueck.
         */
        async function rollAndCapture(): Promise<{
            flavor: string
            dieResult: number | null
        }> {
            const beforeCount = await page.evaluate(() => game.messages.contents.length)

            await attackButton.click()

            const chatIncreased = await page
                .waitForFunction(
                    (baseline) => game.messages.contents.length > baseline,
                    beforeCount,
                    { timeout: 4000 },
                )
                .then(() => true)
                .catch(() => false)

            if (!chatIncreased) {
                // Fallback fuer flaky click delivery in AppV2 overlays.
                await page.evaluate(async () => {
                    const node = document.querySelector(
                        '.application.angriff-dialog .modifier-summary.attack-summary.clickable-summary.angreifen',
                    )
                    node?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true, cancelable: true }),
                    )
                })
            }

            await page.waitForFunction(
                (baseline) => game.messages.contents.length === baseline + 1,
                beforeCount,
                { timeout: 20000 },
            )

            return page.evaluate(() => {
                const msg = game.messages.contents.at(-1)
                return {
                    flavor: msg?.flavor ?? '',
                    dieResult:
                        msg?.rolls?.[0]?.dice?.[0]?.results?.find(
                            (r: { active: boolean }) => r.active,
                        )?.result ?? null,
                }
            })
        }

        // === Durchgang 1: randomUniform 0.99 → W20-Ergebnis 1 → Patzer ===
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.99
        })
        const roll1 = await rollAndCapture()
        expect(roll1.dieResult).toBe(1)
        expect(roll1.flavor).toContain(patzerText)
        expect(roll1.flavor).not.toContain(triumphText)

        // === Durchgang 2: randomUniform 0.01 → W20-Ergebnis 20 → Triumph (Kritischer Treffer) ===
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })
        const roll2 = await rollAndCapture()
        expect(roll2.dieResult).toBe(20)
        expect(roll2.flavor).toContain(triumphText)
        expect(roll2.flavor).not.toContain(patzerText)

        // === Durchgang 3: randomUniform 0.95 → nahe 1, aber kein Patzer ===
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.95
        })
        const roll3 = await rollAndCapture()
        expect(roll3.flavor).not.toContain(patzerText)
        expect(roll3.flavor).not.toContain(triumphText)

        // === Durchgang 4: randomUniform 0.05 → nahe 20, aber kein Triumph ===
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.05
        })
        const roll4 = await rollAndCapture()
        expect(roll4.flavor).not.toContain(patzerText)
        expect(roll4.flavor).not.toContain(triumphText)
        // Nachbereinigung erfolgt durch afterEach
    })
})
