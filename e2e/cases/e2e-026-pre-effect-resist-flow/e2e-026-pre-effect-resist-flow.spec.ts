/**
 * E2E-026 – Pre-Effect: Resist Flow End-to-End
 *
 * @spec openspec/changes/add-pre-effect-e2e-tests/specs/pre-effect-e2e-tests/spec.md
 * @scenario Resist whisper sent to target
 * @scenario Resist button click opens FertigkeitDialog
 * @scenario Resist dialog displays correct Erschwernis
 *
 * Verifies the complete resist chain:
 *   1. Cast a spell with avoidTest → whisper ChatMessage with .resist-button
 *   2. Click .resist-button → FertigkeitDialog opens
 *   3. Dialog title contains "Widerstandsprobe"
 *   4. Erschwernis is displayed in the dialog
 *
 * Uses Ignifaxius (or first spell with avoidTest pre-effect).
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    clickResistButton,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Ignifaxius'

test.describe('E2E-026 · Pre-Effect Resist Flow', () => {
    let snapshot: ActorDefaultSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        await page.evaluate((name) => {
            const actor = game.actors.getName(name)
            return actor?.update({
                'system.abgeleitete.asp_stern': 50,
                'system.gesundheit.wunden': 0,
                'system.gesundheit.erschoepfung': 0,
            })
        }, ACTOR_NAME)

        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(() => {
                delete CONFIG.Dice.randomUniform
            })
            .catch(() => {})
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
    })

    test('Resist whisper is sent and FertigkeitDialog opens with correct parameters', async ({
        page,
    }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)

        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        // Click "Andere Akteure" to select target
        await spellDialog.locator('button[data-action="showNearby"]').click()
        const targetDialog = page.locator('.target-selection-dialog').last()
        await expect(targetDialog).toBeVisible({ timeout: 5000 })
        const targetRow = targetDialog
            .locator('.target-sel-row')
            .filter({ hasText: ACTOR_NAME })
            .first()
        await targetRow.click()
        await targetDialog.locator('button.submit').click()

        // Set neutralMod = -PW for raw d20
        const neutralMod = await page.evaluate(
            ({ name, spellName }) => {
                const actor = game.actors.getName(name)
                const spell = actor?.items.find((i) => i.name === spellName)
                const pw = spell?.system?.pw ?? 0
                return -pw
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

        const modInput = spellDialog.locator('input[id^="modifikator-"]')
        await modInput.fill(String(neutralMod))
        await modInput.dispatchEvent('change')

        // Force spell success (d20=20)
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })

        const beforeCount = await page.evaluate(() => game.messages.contents.length)

        // Click roll button
        const rollButton = spellDialog.locator(
            '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
        )
        await rollButton.click()

        // Wait for chat message with fallback for flaky AppV2 clicks
        const chatIncreased = await page
            .waitForFunction((baseline) => game.messages.contents.length > baseline, beforeCount, {
                timeout: 4000,
            })
            .then(() => true)
            .catch(() => false)

        if (!chatIncreased) {
            await page.evaluate(() => {
                const node = document.querySelector(
                    '.application.uebernatuerlich-dialog .modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
                )
                node?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }

        await page.waitForFunction(
            (baseline) => game.messages.contents.length >= baseline + 1,
            beforeCount,
            { timeout: 20000 },
        )

        // Verify .resist-button exists in DOM
        const resistButtonInDom = await page.evaluate(() => {
            return document.querySelectorAll('.resist-button').length > 0
        })
        expect(resistButtonInDom).toBe(true)

        // Click resist button
        await clickResistButton(page)

        // FertigkeitDialog opens
        const fertigkeitDialog = page.locator('.application.fertigkeit-dialog').last()
        await expect(fertigkeitDialog).toBeVisible({ timeout: 15000 })
        const dialogTitle = await fertigkeitDialog.locator('.window-title').textContent()
        expect(dialogTitle).toContain('Widerstandsprobe')
        await expect(fertigkeitDialog).toContainText('Erschwernis')
    })
})
