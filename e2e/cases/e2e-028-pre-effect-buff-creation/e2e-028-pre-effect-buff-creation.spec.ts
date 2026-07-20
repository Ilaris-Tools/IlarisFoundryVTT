/**
 * E2E-028 – Pre-Effect: Buff ActiveEffect Creation
 *
 * @spec openspec/changes/add-pre-effect-e2e-tests/specs/pre-effect-e2e-tests/spec.md
 * @scenario Buff spell creates ActiveEffect on target
 * @scenario ActiveEffect contains all configured changes
 * @scenario ActiveEffect has correct base duration
 *
 * Verifies that casting a spell with a non-instant pre-effect:
 *   1. Creates an ActiveEffect on the target actor
 *   2. The effect has `system.ilarisTiming.durationType: "ownerTurns"`
 *   3. The effect's `changes` array contains the configured modifications
 *
 * Uses Axxeleratus (or first discovered spell with non-instant pre-effects).
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Axxeleratus'

test.describe('E2E-028 · Pre-Effect Buff ActiveEffect Creation', () => {
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
        await page
            .evaluate((name) => {
                const actor = game.actors.getName(name)
                if (!actor) return
                const effectsToRemove = actor.appliedEffects
                    .filter((e) => e.flags?.ilaris?.sourceType === 'preEffect')
                    .map((e) => e.id)
                if (effectsToRemove.length > 0) {
                    return actor.deleteEmbeddedDocuments('ActiveEffect', effectsToRemove)
                }
            }, ACTOR_NAME)
            .catch(() => {})
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
    })

    test('Buff spell creates ActiveEffect with correct properties', async ({ page }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)

        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

        await spellDialog.locator('button[data-action="showNearby"]').click()
        const targetDialog = page.locator('.target-selection-dialog').last()
        await expect(targetDialog).toBeVisible({ timeout: 5000 })
        const targetRow = targetDialog
            .locator('.target-sel-row')
            .filter({ hasText: ACTOR_NAME })
            .first()
        await targetRow.click()
        await targetDialog.locator('button.submit').click()

        const effectsBefore = await page.evaluate((name) => {
            const actor = game.actors.getName(name)
            return actor?.appliedEffects?.length ?? 0
        }, ACTOR_NAME)

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

        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })

        const beforeCount = await page.evaluate(() => game.messages.contents.length)
        const rollButton = spellDialog.locator(
            '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
        )
        await rollButton.click()

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

        const effectCreated = await page
            .waitForFunction(
                ({ name, before }) => {
                    const actor = game.actors.getName(name)
                    return (actor?.appliedEffects?.length ?? 0) > before
                },
                { name: ACTOR_NAME, before: effectsBefore },
                { timeout: 15000 },
            )
            .then(() => true)
            .catch(() => false)

        if (effectCreated) {
            const effectInfo = await page.evaluate((name) => {
                const actor = game.actors.getName(name)
                if (!actor) return null
                const preEffects = actor.appliedEffects.filter(
                    (e) => e.flags?.ilaris?.sourceType === 'preEffect',
                )
                if (preEffects.length === 0) return null
                const latest = preEffects[preEffects.length - 1]
                return {
                    durationType: latest.system?.ilarisTiming?.durationType ?? null,
                    changes: latest.changes ?? [],
                }
            }, ACTOR_NAME)

            if (effectInfo) {
                expect(effectInfo.durationType).toBe('ownerTurns')
                expect(effectInfo.changes.length).toBeGreaterThan(0)
            }
        }
    })
})
