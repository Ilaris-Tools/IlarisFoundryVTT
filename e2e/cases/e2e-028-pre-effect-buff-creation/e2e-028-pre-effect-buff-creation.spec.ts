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
    enableTargetSelectionForTest,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Axxeleratus'

test.describe('E2E-028 · Pre-Effect Buff ActiveEffect Creation', () => {
    let snapshot: ActorDefaultSnapshot
    let targetSelectionSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let initialEffectIds: string[]

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)
        initialEffectIds = await page.evaluate(
            (name) =>
                Array.from(game.actors.getName(name)?.effects ?? []).map(
                    (effect: any) => effect.id,
                ),
            ACTOR_NAME,
        )

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
        await page
            .evaluate(
                async ({ name, effectIds }) => {
                    const actor = game.actors.getName(name)
                    const createdEffectIds = Array.from(actor?.effects ?? [])
                        .filter((effect: any) => !effectIds.includes(effect.id))
                        .map((effect: any) => effect.id)
                    if (createdEffectIds.length > 0) {
                        await actor?.deleteEmbeddedDocuments('ActiveEffect', createdEffectIds)
                    }
                },
                { name: ACTOR_NAME, effectIds: initialEffectIds },
            )
            .catch(() => {})
        await restoreFoundrySetting(page, targetSelectionSetting).catch(() => {})
        await clearChatLog(page).catch(() => {})
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
            async ({ name, spellName }) => {
                const actor = game.actors.getName(name)
                if (!actor) return null
                const matches = actor.effects.filter(
                    (e: any) =>
                        e.flags?.ilaris?.spellName?.includes?.(spellName) ||
                        e.name?.includes?.(spellName),
                )
                if (matches.length === 0) return null
                const latest = matches[matches.length - 1] as any
                const spell = await foundry.utils.fromUuid(latest.flags?.ilaris?.spellUuid)
                const source = Object.values(spell?.system?.preEffects ?? {})[0] as any
                const normalizeChange = (change: any) => ({
                    key: change.key ?? '',
                    mode:
                        typeof change.mode === 'number'
                            ? change.mode
                            : change.type === 'custom'
                              ? 10
                              : change.type === 'multiply'
                                ? 4
                                : change.type === 'override'
                                  ? 1
                                  : 2,
                    value: change.value ?? '0',
                    priority: change.priority ?? null,
                })
                return {
                    name: latest.name ?? '',
                    durationType: latest.system?.ilarisTiming?.durationType ?? null,
                    turns:
                        latest.duration?.turns ??
                        latest._source?.duration?.turns ??
                        latest._source?.duration?.value ??
                        null,
                    remaining: latest.system?.ilarisTiming?.remaining ?? null,
                    original: latest.system?.ilarisTiming?.originalValue ?? null,
                    changes: (latest._source?.changes ?? latest.changes ?? []).map(normalizeChange),
                    sourceType: latest.flags?.ilaris?.sourceType ?? null,
                    expectedChanges: (source?.changes ?? []).map(normalizeChange),
                    expectedDuration: (source?.baseDuration ?? 0) + 1,
                }
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

        expect(effectInfo).not.toBeNull()
        expect(effectInfo!.name).toContain(SPELL_NAME)
        expect(effectInfo!.durationType).toBe('ownerTurns')
        expect(effectInfo!.changes).toEqual(effectInfo!.expectedChanges)
        expect(effectInfo!.turns).toBe(effectInfo!.expectedDuration)
        expect(effectInfo!.remaining).toBe(effectInfo!.expectedDuration)
        expect(effectInfo!.original).toBe(effectInfo!.expectedDuration)
    })
})
