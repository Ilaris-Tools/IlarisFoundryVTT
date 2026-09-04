/**
 * E2E-025 – Pre-Effect: Instant Damage via Spell Cast
 *
 * @spec openspec/changes/add-pre-effect-e2e-tests/specs/pre-effect-e2e-tests/spec.md
 * @scenario Cast instant damage spell updates target wounds
 *
 * Verifies that casting a spell with `instant: true` pre-effect:
 *   1. Updates the target actor's wounds
 *   2. Creates a chat message describing the damage
 *
 * Uses Fulminictus Donnerkeil, imported from the compendium source (a
 * non-ballistic instant-damage spell) so the instant Pre-Effects apply
 * directly after a successful targeted cast.
 * The test actor is both caster and target.
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    enableTargetSelectionForTest,
    getActorWounds,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Fulminictus Donnerkeil'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

test.describe('E2E-025 · Pre-Effect Instant Damage', () => {
    let snapshot: ActorDefaultSnapshot
    let targetSelectionSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        await page.evaluate((name) => {
            const actor = game.actors.getName(name)
            return actor?.update({
                'system.abgeleitete.asp_stern': 50,
                'system.gesundheit.wunden': 0,
                'system.gesundheit.erschoepfung': 0,
            })
        }, ACTOR_NAME)

        // Import the naturally non-ballistic instant-damage spell from the
        // packed compendium source. It is not part of the baseline actor, so
        // the actor snapshot restore removes it again in afterEach.
        await page.evaluate(
            async ({ name, packId, spellName }) => {
                const actor = game.actors.getName(name)
                if (actor?.items.some((item) => item.name === spellName)) return
                const pack = game.packs?.get(packId)
                const source = (await pack?.getDocuments?.())?.find(
                    (item) => item.name === spellName,
                )
                if (!source) throw new Error('Fulminictus fehlt im Kompendium.')
                const itemData = foundry.utils.deepClone(source.toObject())
                delete itemData._id
                await actor.createEmbeddedDocuments('Item', [itemData])
            },
            { name: ACTOR_NAME, packId: SPELL_PACK, spellName: SPELL_NAME },
        )

        await clearChatLog(page)
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

    test('Cast instant-damage spell updates target wounds', async ({ page }) => {
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

        // Set neutralMod = -PW to get a raw d20 result
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

        // Force success: d20=20 (randomUniform close to 0 → high roll)
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })

        const wundenBefore = await getActorWounds(page, ACTOR_NAME)
        const beforeCount = await page.evaluate(() => game.messages.contents.length)

        // Click the roll button
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

        // Wait for chat messages
        await page.waitForFunction(
            (baseline) => game.messages.contents.length >= baseline + 1,
            beforeCount,
            { timeout: 20000 },
        )

        // The instant pre-effect damage is applied fire-and-forget AFTER the spell
        // roll chat message is created, so we must wait for the actor update itself
        // instead of relying on the first chat message.
        await page.waitForFunction(
            ({ name, before }) => {
                const actor = game.actors.getName(name) as any
                return (actor?.system?.gesundheit?.wunden ?? 0) > before
            },
            { name: ACTOR_NAME, before: wundenBefore.wunden },
            { timeout: 20000 },
        )

        const wundenAfter = await getActorWounds(page, ACTOR_NAME)
        const damageAmount = await page.evaluate((baseline) => {
            const damageMessage = game.messages.contents
                .slice(baseline)
                .find((message: any) => /Schaden:\s*\d+/.test(message.content ?? ''))
            return Number((damageMessage?.content ?? '').match(/Schaden:\s*(\d+)/)?.[1] ?? NaN)
        }, beforeCount)
        const ws = await page.evaluate((name) => {
            const actor = game.actors.getName(name) as any
            return actor?.system?.abgeleitete?.ws ?? 0
        }, ACTOR_NAME)
        expect(damageAmount).toBeGreaterThan(0)
        expect(wundenAfter.wunden - wundenBefore.wunden).toBe(
            damageAmount > ws ? Math.floor((damageAmount - 1) / ws) : 0,
        )

        // Verify chat messages include the spell name
        const messages = await page.evaluate(
            ({ baseline, spellName }) => {
                const msgs = game.messages.contents.slice(baseline)
                return msgs.map((m: any) => ({
                    flavor: m.flavor ?? '',
                    content: m.content ?? '',
                }))
            },
            { baseline: beforeCount, spellName: SPELL_NAME },
        )

        const spellMsgs = messages.filter(
            (m: { flavor: string; content: string }) =>
                m.flavor.includes(SPELL_NAME) || m.content.includes(SPELL_NAME),
        )
        expect(spellMsgs.length).toBeGreaterThan(0)
    })

    test('damage at or below WS creates chat feedback without adding wounds', async ({ page }) => {
        await page.evaluate(
            ({ name, spellName }) => {
                const spell = game.actors
                    .getName(name)
                    ?.items.find((item: any) => item.name?.includes(spellName))
                const preEffects = foundry.utils.deepClone(spell?.system?.preEffects ?? [])
                for (const preEffect of Object.values(preEffects) as any[]) {
                    preEffect.instant = true
                    for (const change of preEffect.changes ?? []) {
                        change.value = '1'
                        change.maechtigBonus = ''
                    }
                }
                return spell?.update({ 'system.preEffects': preEffects })
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)
        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await spellDialog.locator('button[data-action="showNearby"]').click()
        const targetDialog = page.locator('.target-selection-dialog').last()
        await expect(targetDialog).toBeVisible({ timeout: 5000 })
        await targetDialog
            .locator('.target-sel-row')
            .filter({ hasText: ACTOR_NAME })
            .first()
            .click()
        await targetDialog.locator('button.submit').click()

        const neutralMod = await page.evaluate(
            ({ name, spellName }) => {
                const spell = game.actors
                    .getName(name)
                    ?.items.find((item: any) => item.name?.includes(spellName))
                return -(spell?.system?.pw ?? 0)
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )
        const modInput = spellDialog.locator('input[id^="modifikator-"]')
        await modInput.fill(String(neutralMod))
        await modInput.dispatchEvent('change')
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })
        const wundenBefore = await getActorWounds(page, ACTOR_NAME)
        const beforeCount = await page.evaluate(() => game.messages.contents.length)
        await spellDialog
            .locator('.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]')
            .click()
        const chatIncreased = await page
            .waitForFunction((baseline) => game.messages.contents.length > baseline, beforeCount, {
                timeout: 4000,
            })
            .then(() => true)
            .catch(() => false)
        if (!chatIncreased) {
            await page.evaluate(() => {
                document
                    .querySelector(
                        '.application.uebernatuerlich-dialog .modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
                    )
                    ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }
        await page.waitForFunction(
            (baseline) =>
                game.messages.contents
                    .slice(baseline)
                    .some((message: any) =>
                        /Schaden\s*\(1\).*nicht hoch genug/.test(message.content ?? ''),
                    ),
            beforeCount,
            { timeout: 20000 },
        )
        expect((await getActorWounds(page, ACTOR_NAME)).wunden).toBe(wundenBefore.wunden)
    })

    test('Pandämonium-like damage-only approximation applies exactly once', async ({ page }) => {
        await page.evaluate(
            ({ name, spellName }) => {
                const spell = game.actors
                    .getName(name)
                    ?.items.find((item: any) => item.name?.includes(spellName))
                return spell?.update({
                    'system.preEffects': [
                        {
                            baseDuration: 0,
                            instant: true,
                            changes: [
                                {
                                    key: 'system.gesundheit.wunden',
                                    type: 'add',
                                    value: '2W6',
                                    amplifiedByMaechtigeMagie: true,
                                    maechtigBonus: '+1W6',
                                    damageType: 'PROFAN',
                                },
                            ],
                            avoidTest: { enabled: false },
                        },
                    ],
                })
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )

        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)
        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await spellDialog.locator('button[data-action="showNearby"]').click()
        const targetDialog = page.locator('.target-selection-dialog').last()
        await expect(targetDialog).toBeVisible({ timeout: 5000 })
        await targetDialog
            .locator('.target-sel-row')
            .filter({ hasText: ACTOR_NAME })
            .first()
            .click()
        await targetDialog.locator('button.submit').click()

        const neutralMod = await page.evaluate(
            ({ name, spellName }) => {
                const spell = game.actors
                    .getName(name)
                    ?.items.find((item: any) => item.name?.includes(spellName))
                return -(spell?.system?.pw ?? 0)
            },
            { name: ACTOR_NAME, spellName: SPELL_NAME },
        )
        await spellDialog.locator('input[id^="modifikator-"]').fill(String(neutralMod))
        await spellDialog.locator('input[id^="modifikator-"]').dispatchEvent('change')
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })

        const wundenBefore = await getActorWounds(page, ACTOR_NAME)
        const messageBaseline = await page.evaluate(() => game.messages.contents.length)
        await spellDialog
            .locator('.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]')
            .click()
        await page.waitForFunction(
            ({ name, before }) => {
                const actor = game.actors.getName(name) as any
                return (actor?.system?.gesundheit?.wunden ?? 0) > before
            },
            { name: ACTOR_NAME, before: wundenBefore.wunden },
            { timeout: 20000 },
        )
        await page.waitForTimeout(250)

        const damageMessages = await page.evaluate(
            (baseline) =>
                game.messages.contents
                    .slice(baseline)
                    .filter((message: any) => /Schaden:\s*\d+/.test(message.content ?? '')).length,
            messageBaseline,
        )
        expect(damageMessages).toBe(1)
    })
})
