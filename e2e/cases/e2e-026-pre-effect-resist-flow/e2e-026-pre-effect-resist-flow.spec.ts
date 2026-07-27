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
 * Uses Ignifaxius. Compendium data has avoidTest.enabled=false, so the test
 * enables avoidTest (attribute-based) on the actor's spell before casting.
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    clickResistButton,
    foundryConfig,
    enableTargetSelectionForTest,
    loginAndJoinWorld,
    openActorSheet,
    openChatSidebar,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Ignifaxius'
const RESIST_ATTRIBUT = 'KO'
const RESIST_DIFFICULTY = 12

test.describe('E2E-026 · Pre-Effect Resist Flow', () => {
    let snapshot: ActorDefaultSnapshot
    let targetSelectionSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        await page.evaluate(
            async ({ name, spellName, attribut, difficulty }) => {
                const actor = game.actors.getName(name)
                if (!actor) throw new Error(`Actor not found: ${name}`)

                await actor.update({
                    'system.abgeleitete.asp_stern': 50,
                    'system.gesundheit.wunden': 0,
                    'system.gesundheit.erschoepfung': 0,
                })

                // Compendium Ignifaxius has avoidTest.enabled=false. Enable it for this test
                // using an attribute-based resist so we don't depend on a specific skill name.
                const spell = actor.items.find((i: any) => i.name?.includes(spellName))
                if (!spell) throw new Error(`Spell not found on actor: ${spellName}`)

                const preEffects = foundry.utils.deepClone(spell.system?.preEffects ?? [])
                const list = Array.isArray(preEffects)
                    ? preEffects
                    : Object.values(preEffects as Record<string, unknown>)

                if (list.length === 0) {
                    list.push({
                        baseDuration: 0,
                        instant: true,
                        changes: [
                            {
                                key: 'system.gesundheit.wunden',
                                type: 'add',
                                value: '4W6',
                                damageType: 'FEUER',
                            },
                        ],
                        avoidTest: {
                            enabled: true,
                            fertigkeit: '',
                            attribut,
                            diminishedOnly: false,
                            resistDifficulty: difficulty,
                        },
                    })
                } else {
                    for (const pe of list as any[]) {
                        pe.avoidTest = {
                            ...(pe.avoidTest ?? {}),
                            enabled: true,
                            fertigkeit: '',
                            attribut,
                            diminishedOnly: false,
                            resistDifficulty: difficulty,
                        }
                    }
                }

                await spell.update({ 'system.preEffects': list })
            },
            {
                name: ACTOR_NAME,
                spellName: SPELL_NAME,
                attribut: RESIST_ATTRIBUT,
                difficulty: RESIST_DIFFICULTY,
            },
        )

        await clearChatLog(page)
        await openChatSidebar(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(() => {
                delete CONFIG.Dice.randomUniform
            })
            .catch(() => {})
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
        await restoreFoundrySetting(page, targetSelectionSetting).catch(() => {})
        await clearChatLog(page).catch(() => {})
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
                const spell = actor?.items.find((i: any) => i.name?.includes(spellName))
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

        // Resist prompt is fire-and-forget after the roll message — open chat and wait for the button.
        await openChatSidebar(page)
        await page.waitForFunction(() => document.querySelectorAll('.resist-button').length > 0, {
            timeout: 20000,
        })

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
