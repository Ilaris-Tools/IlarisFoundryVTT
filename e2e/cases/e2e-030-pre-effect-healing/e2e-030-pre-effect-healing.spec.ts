/**
 * E2E-030 – Pre-Effect: Instant Healing via Spell Cast
 *
 * @spec openspec/changes/healing-damage-types/specs/combat/spec.md
 * @scenario Healing type heals wounds
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    clearChatLog,
    enableTargetSelectionForTest,
    foundryConfig,
    getActorWounds,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Balsam Salabunde'

test.describe('E2E-030 · Pre-Effect Instant Healing', () => {
    let snapshot: ActorDefaultSnapshot
    let targetSelectionSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let damageTypesSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot
    let importedItemId: string | null = null

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        targetSelectionSetting = await enableTargetSelectionForTest(page)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        const configuredDamageTypes = await page.evaluate(() => {
            const raw = game.settings.get('Ilaris', 'damageTypes')
            try {
                const parsed = JSON.parse(raw || '[]')
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        })
        const healingWound = configuredDamageTypes.find(
            (type: any) => type.value === 'HEALING_WOUND',
        )
        if (healingWound) {
            healingWound.behavior = {
                ...healingWound.behavior,
                healing: true,
                targetsErschoepfung: false,
                bypassesArmor: false,
            }
        } else {
            configuredDamageTypes.push({
                value: 'HEALING_WOUND',
                label: 'Heilung (Wunden)',
                behavior: { healing: true, targetsErschoepfung: false, bypassesArmor: false },
            })
        }
        damageTypesSetting = await setFoundrySettingForTest(
            page,
            'Ilaris',
            'damageTypes',
            JSON.stringify(configuredDamageTypes),
        )

        importedItemId = await page.evaluate(
            async ({ actorName, spellName }) => {
                const actor = game.actors.getName(actorName)
                if (!actor) throw new Error(`Actor not found: ${actorName}`)

                const itemPacks = game.packs.contents.filter((pack) => pack.documentName === 'Item')
                const spellPack =
                    itemPacks.find((pack) => /zauberspruch/i.test(pack.metadata?.label ?? '')) ??
                    itemPacks.find((pack) => /zauberspruch/i.test(pack.collection ?? '')) ??
                    null
                if (!spellPack) throw new Error('Zauberspruch compendium not found')

                const index = await spellPack.getIndex()
                const entry = index.find((item) => item.name === spellName)
                if (!entry) throw new Error(`Spell not found: ${spellName}`)

                const source = (await spellPack.getDocument(entry._id)).toObject()
                delete source._id
                const [created] = await actor.createEmbeddedDocuments('Item', [source])
                return created?.id ?? null
            },
            { actorName: ACTOR_NAME, spellName: SPELL_NAME },
        )
        if (!importedItemId) throw new Error(`Failed to import ${SPELL_NAME}`)

        await page.evaluate((name) => {
            const actor = game.actors.getName(name)
            return actor?.update({
                'system.abgeleitete.asp_stern': 50,
                'system.gesundheit.wunden': 1,
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
        await restoreFoundrySetting(page, targetSelectionSetting).catch(() => {})
        await restoreFoundrySetting(page, damageTypesSetting).catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Balsam heals wounds with HEALING_WOUND and a positive formula', async ({ page }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)
        await openSpellDialog(actorWindow, SPELL_NAME)

        const spellDialog = page.locator('.application.uebernatuerlich-dialog').last()
        await expect(spellDialog).toBeVisible({ timeout: 15000 })

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
            ({ actorName, spellName }) => {
                const actor = game.actors.getName(actorName)
                const spell = actor?.items.find((item) => item.name === spellName)
                return -(spell?.system?.pw ?? 0)
            },
            { actorName: ACTOR_NAME, spellName: SPELL_NAME },
        )
        const modInput = spellDialog.locator('input[id^="modifikator-"]')
        await modInput.fill(String(neutralMod))
        await modInput.dispatchEvent('change')
        await page.evaluate(() => {
            CONFIG.Dice.randomUniform = () => 0.01
        })

        const woundsBefore = await getActorWounds(page, ACTOR_NAME)
        const messageCount = await page.evaluate(() => game.messages.contents.length)
        const rollButton = spellDialog.locator(
            '.modifier-summary.talent-summary.clickable-summary[data-action="angreifen"]',
        )
        await rollButton.click()

        const chatIncreased = await page
            .waitForFunction((baseline) => game.messages.contents.length > baseline, messageCount, {
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
            messageCount,
            {
                timeout: 20000,
            },
        )

        await page.waitForFunction(
            ({ name, before }) => {
                const actor = game.actors.getName(name) as any
                return (actor?.system?.gesundheit?.wunden ?? before) < before
            },
            { name: ACTOR_NAME, before: woundsBefore.wunden },
            { timeout: 20000 },
        )

        const woundsAfter = await getActorWounds(page, ACTOR_NAME)
        const healingAmount = await page.evaluate((baseline) => {
            const healingMessage = game.messages.contents
                .slice(baseline)
                .find((message: any) => (message.content ?? '').includes('Heilung:'))
            return Number((healingMessage?.content ?? '').match(/Heilung:\s*(\d+)/)?.[1] ?? NaN)
        }, messageCount)
        const ws = await page.evaluate((name) => {
            const actor = game.actors.getName(name) as any
            return actor?.system?.abgeleitete?.ws ?? 0
        }, ACTOR_NAME)
        const expectedReduction = healingAmount > ws ? Math.floor((healingAmount - 1) / ws) : 0
        expect(healingAmount).toBeGreaterThan(0)
        expect(woundsAfter.wunden).toBe(Math.max(0, woundsBefore.wunden - expectedReduction))
        expect(woundsAfter.wunden).toBe(0)

        const hasHealingMessage = await page.evaluate((baseline) => {
            return game.messages.contents.slice(baseline).some((message: any) => {
                return (message.content ?? '').includes('heilt')
            })
        }, messageCount)
        expect(hasHealingMessage).toBe(true)
    })
})
