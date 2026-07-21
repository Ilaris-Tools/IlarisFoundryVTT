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
 * Uses Ignifaxius (or first discovered spell with instant pre-effects).
 * The test actor is both caster and target.
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    getActorWounds,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Ignifaxius'

test.describe('E2E-025 · Pre-Effect Instant Damage', () => {
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

        // Verify wounds increased
        const wundenAfter = await getActorWounds(page, ACTOR_NAME)
        expect(wundenAfter.wunden).toBeGreaterThan(wundenBefore.wunden)

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
})
