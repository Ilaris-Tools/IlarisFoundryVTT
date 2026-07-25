import { expect, test } from '@playwright/test'

import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
} from '../../shared/fixtures/foundry'

test.describe('E2E-003 Manoever-Kombination: Wuchtschlag + Gezielter Schlag + Schildspalter', () => {
    test.afterEach(async ({ page }) => {
        await clearChatLog(page).catch(() => {})
    })

    test('Manoever setzen, AT-Modifikatoren validieren, Angriff- und Schaden-Chat pruefen', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)

        // Open Testlauf-Held actor sheet
        const actorWindow = await openActorSheet(page, 'Testlauf-Held')

        // Navigate to Kampf tab
        await actorWindow.locator('nav [data-tab="kampf"]').click()

        // Open attack dialog for first weapon
        const firstAttackBtn = actorWindow
            .locator(
                'section.tab.kampf tbody tr [data-action="rollable"][data-rolltype="angriff_diag"]',
            )
            .first()
        await expect(firstAttackBtn).toBeVisible({ timeout: 15000 })
        await firstAttackBtn.click()

        const attackDialog = page.locator('.application.angriff-dialog').last()
        await expect(attackDialog).toBeVisible({ timeout: 15000 })

        // ------------------------------------------------------------------ //
        // Expand Manoever section
        // ------------------------------------------------------------------ //
        await attackDialog.locator('.maneuver-header').click()
        await expect(attackDialog.locator('.maneuver-grid')).not.toHaveClass(/collapsed/, {
            timeout: 5000,
        })

        // ------------------------------------------------------------------ //
        // Set Wuchtschlag to 3 (NUMBER input)
        // The AppV2 dialog uses Foundry document UUIDs in element IDs;
        // use text-based .maneuver-item selectors instead.
        // ------------------------------------------------------------------ //
        const wuchtschlagInput = attackDialog
            .locator('.maneuver-item')
            .filter({ hasText: 'Wuchtschlag' })
            .locator('input[type="number"]')
        await wuchtschlagInput.fill('3')
        await wuchtschlagInput.dispatchEvent('change')

        // ------------------------------------------------------------------ //
        // Select Gezielter Schlag — Schildarm (TREFFER_ZONE select)
        // ------------------------------------------------------------------ //
        const gezielterSchlagSelect = attackDialog
            .locator('.maneuver-item')
            .filter({ hasText: 'Gezielter Schlag' })
            .locator('select')
        await gezielterSchlagSelect.selectOption({ label: 'Schildarm' })

        // ------------------------------------------------------------------ //
        // Check Schildspalter (CHECKBOX)
        // ------------------------------------------------------------------ //
        const schildspalterCheckbox = attackDialog
            .locator('.maneuver-item')
            .filter({ hasText: 'Schildspalter' })
            .locator('input[type="checkbox"]')
        await schildspalterCheckbox.check()
        await schildspalterCheckbox.dispatchEvent('change')

        // ------------------------------------------------------------------ //
        // Verify AT modifier summary (debounced update — up to 10 s)
        // ------------------------------------------------------------------ //
        const attackSummary = attackDialog.locator('.modifier-summary.attack-summary')

        await expect(
            attackSummary
                .locator('.modifier-item.maneuver')
                .filter({ hasText: 'Gezielter Schlag (Schildarm): -2' }),
        ).toBeVisible({ timeout: 10000 })

        await expect(
            attackSummary
                .locator('.modifier-item.maneuver')
                .filter({ hasText: 'Schildspalter: +2' }),
        ).toBeVisible()

        await expect(
            attackSummary.locator('.modifier-item.maneuver').filter({ hasText: 'Wuchtschlag: -3' }),
        ).toBeVisible()

        await expect(attackSummary.locator('.modifier-item.total')).toContainText(
            'Addierte Modifikatoren: -3',
        )

        // ------------------------------------------------------------------ //
        // Roll attack
        // ------------------------------------------------------------------ //
        const beforeAttackCount = await page.evaluate(() => game.messages.contents.length)

        const attackButton = attackDialog.locator(
            '.modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
        )
        await attackButton.click()

        const attackChatIncreased = await page
            .waitForFunction(
                (baseline) => game.messages.contents.length > baseline,
                beforeAttackCount,
                { timeout: 4000 },
            )
            .then(() => true)
            .catch(() => false)

        if (!attackChatIncreased) {
            // Fallback for flaky click delivery through AppV2 overlays
            await page.evaluate(() => {
                const node = document.querySelector(
                    '.application.angriff-dialog .modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]',
                )
                node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }

        await page.waitForFunction(
            (baseline) => game.messages.contents.length === baseline + 1,
            beforeAttackCount,
            { timeout: 20000 },
        )

        // ------------------------------------------------------------------ //
        // Validate attack chat message (image 1)
        // ------------------------------------------------------------------ //
        const attackMsg = await page.evaluate(() => {
            const msg = game.messages.contents.at(-1)
            return {
                flavor: msg?.flavor ?? '',
                total: msg?.rolls?.[0]?.total ?? null,
                formula: msg?.rolls?.[0]?.formula ?? '',
            }
        })

        expect(attackMsg.flavor).toContain('Attacke (')
        expect(attackMsg.flavor).toContain('Gezielter Schlag (Schildarm): -2')
        expect(attackMsg.flavor).toContain('Schildspalter: +2')
        expect(attackMsg.flavor).toContain('Wuchtschlag: -3')
        expect(attackMsg.formula.toLowerCase()).toContain('d20')
        expect(Number.isNaN(Number(attackMsg.total))).toBeFalsy()
        // A modified d20 roll can validly total zero. It remains a valid result
        // as long as Foundry produced a numeric d20 roll.
        expect(Number(attackMsg.total)).toBeGreaterThanOrEqual(0)
        expect(attackMsg.flavor).not.toContain('undefined')
        expect(attackMsg.flavor).not.toContain('<h2></h2>')

        // ------------------------------------------------------------------ //
        // Validate damage summary in dialog (image 2)
        // ------------------------------------------------------------------ //
        const damageSummary = attackDialog.locator('.modifier-summary.damage-summary')
        await expect(damageSummary).toBeVisible({ timeout: 10000 })
        await expect(damageSummary.locator('.modifier-item.base-value')).toContainText(
            'Basis Schaden:',
        )
        await expect(
            damageSummary.locator('.modifier-item.maneuver').filter({ hasText: 'Wuchtschlag: +3' }),
        ).toBeVisible()

        // ------------------------------------------------------------------ //
        // Roll damage
        // ------------------------------------------------------------------ //
        const beforeDamageCount = await page.evaluate(() => game.messages.contents.length)

        const damageButton = attackDialog.locator(
            '.modifier-summary.damage-summary.clickable-summary[data-action="schaden"]',
        )
        await damageButton.click()

        const damageChatIncreased = await page
            .waitForFunction(
                (baseline) => game.messages.contents.length > baseline,
                beforeDamageCount,
                { timeout: 4000 },
            )
            .then(() => true)
            .catch(() => false)

        if (!damageChatIncreased) {
            // Fallback for flaky click delivery through AppV2 overlays
            await page.evaluate(() => {
                const node = document.querySelector(
                    '.application.angriff-dialog .modifier-summary.damage-summary.clickable-summary[data-action="schaden"]',
                )
                node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }

        await page.waitForFunction(
            (baseline) => game.messages.contents.length === baseline + 1,
            beforeDamageCount,
            { timeout: 20000 },
        )

        // ------------------------------------------------------------------ //
        // Validate damage chat message (image 3)
        // ------------------------------------------------------------------ //
        const damageMsg = await page.evaluate(() => {
            const msg = game.messages.contents.at(-1)
            return {
                flavor: msg?.flavor ?? '',
                total: msg?.rolls?.[0]?.total ?? null,
                formula: msg?.rolls?.[0]?.formula ?? '',
            }
        })

        expect(damageMsg.flavor).toContain('Schaden (')
        expect(damageMsg.flavor).toContain('Wuchtschlag: +3')
        expect(Number.isNaN(Number(damageMsg.total))).toBeFalsy()
        expect(Number(damageMsg.total)).toBeGreaterThanOrEqual(0)
        expect(damageMsg.flavor).not.toContain('undefined')
        expect(damageMsg.flavor).not.toContain('<h2></h2>')
    })
})
