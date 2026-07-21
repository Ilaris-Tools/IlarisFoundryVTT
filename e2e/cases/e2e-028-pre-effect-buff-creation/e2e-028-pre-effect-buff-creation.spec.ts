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
 * Uses Axxeleratus. Processor tags AEs with flags.ilaris.sourceType = 'uebernatuerlich'
 * and flags.ilaris.spellName = spell name.
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
            .evaluate(
                async ({ name, spellName }) => {
                    const actor = game.actors.getName(name)
                    if (!actor) return
                    // Match by spellName flag / effect name (sourceType is 'uebernatuerlich')
                    const effectsToRemove = actor.effects
                        .filter(
                            (e: any) =>
                                e.flags?.ilaris?.spellName?.includes?.(spellName) ||
                                e.name?.includes?.(spellName),
                        )
                        .map((e: any) => e.id)
                    if (effectsToRemove.length > 0) {
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectsToRemove)
                    }
                },
                { name: ACTOR_NAME, spellName: SPELL_NAME },
            )
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

        const effectsBefore = await page.evaluate(
            ({ name, spellName }) => {
                const actor = game.actors.getName(name)
                if (!actor) return 0
                return actor.effects.filter(
                    (e: any) =>
                        e.flags?.ilaris?.spellName?.includes?.(spellName) ||
                        e.name?.includes?.(spellName),
                ).length
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

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

        // ActiveEffect creation is fire-and-forget after the roll chat message.
        await page.waitForFunction(
            ({ name, spellName, before }) => {
                const actor = game.actors.getName(name)
                if (!actor) return false
                const count = actor.effects.filter(
                    (e: any) =>
                        e.flags?.ilaris?.spellName?.includes?.(spellName) ||
                        e.name?.includes?.(spellName),
                ).length
                return count > before
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME, before: effectsBefore },
            { timeout: 20000 },
        )

        const effectInfo = await page.evaluate(
            ({ name, spellName }) => {
                const actor = game.actors.getName(name)
                if (!actor) return null
                const matches = actor.effects.filter(
                    (e: any) =>
                        e.flags?.ilaris?.spellName?.includes?.(spellName) ||
                        e.name?.includes?.(spellName),
                )
                if (matches.length === 0) return null
                const latest = matches[matches.length - 1] as any
                return {
                    name: latest.name ?? '',
                    durationType: latest.system?.ilarisTiming?.durationType ?? null,
                    changes: latest.changes ?? [],
                    sourceType: latest.flags?.ilaris?.sourceType ?? null,
                }
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

        expect(effectInfo).not.toBeNull()
        expect(effectInfo!.name).toContain(SPELL_NAME)
        expect(effectInfo!.durationType).toBe('ownerTurns')
        expect(effectInfo!.changes.length).toBeGreaterThan(0)
    })
})
