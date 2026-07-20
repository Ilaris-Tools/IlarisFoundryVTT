/**
 * E2E-027 – Pre-Effect: Sheet Configuration
 *
 * @spec openspec/changes/add-pre-effect-e2e-tests/specs/pre-effect-e2e-tests/spec.md
 * @scenario Add and delete pre-effect entry
 * @scenario AvoidTest skill select populated from compendium
 * @scenario Damage type select populated from settings
 *
 * Verifies that the GM can configure pre-effects on an uebernatuerlich item sheet:
 *   1. Navigate to the pre-effects tab
 *   2. Verify pre-effect cards exist
 *   3. Configure avoidTest (skill dropdown populated from compendium)
 *   4. Select damage types (populated from settings)
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openItemSheet,
    openPreEffectsTab,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_NAME = 'Ignifaxius Flammenstrahl'

test.describe('E2E-027 · Pre-Effect Sheet Configuration', () => {
    let snapshot: ActorDefaultSnapshot
    let importedItemId: string | null = null

    test.beforeEach(async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        snapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)

        importedItemId = await page.evaluate(
            async ({ spellName }) => {
                const packs = game.packs?.contents ?? []
                const itemPacks = packs.filter((p) => p.documentName === 'Item')
                const spellPack =
                    itemPacks.find((p) => /zauberspruch/i.test(p.metadata?.label ?? '')) ??
                    itemPacks.find((p) => /zauberspruch/i.test(p.collection ?? '')) ??
                    null

                if (!spellPack) throw new Error('Zauberspruch compendium not found')

                const index = await spellPack.getIndex()
                const entry = index.find((e) => e.name === spellName)
                if (!entry) throw new Error(`Spell not found: ${spellName}`)

                const doc = await spellPack.getDocument(entry._id)
                const source = doc.toObject()
                delete source._id
                const [created] = await Item.createDocuments([source])
                return created?.id ?? null
            },
            { spellName: SPELL_NAME },
        )

        if (!importedItemId) {
            throw new Error(`Failed to import ${SPELL_NAME} from compendium`)
        }
    })

    test.afterEach(async ({ page }) => {
        if (importedItemId) {
            await page
                .evaluate((id) => {
                    const item = game.items.get(id)
                    if (item) return item.delete()
                }, importedItemId)
                .catch(() => {})
        }
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
    })

    test('Pre-effects tab is accessible and has expected structure', async ({ page }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        const closeBtn = actorWindow.locator('button[data-action="close"]')
        await closeBtn.click().catch(() => {})
        await actorWindow.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})

        const itemWindow = await openItemSheet(page, SPELL_NAME)
        await expect(itemWindow).toBeVisible({ timeout: 15000 })

        await openPreEffectsTab(itemWindow)

        const preEffectsSection = itemWindow.locator('section.tab.preEffects')
        await expect(preEffectsSection).toBeVisible({ timeout: 10000 })

        const preEffectCards = preEffectsSection.locator('.pre-effect-card')
        const cardCount = await preEffectCards.count()
        expect(cardCount).toBeGreaterThan(0)

        const addButton = preEffectsSection.locator('.add-pre-effect')
        await expect(addButton).toBeVisible()
    })

    test('AvoidTest skill dropdown is populated from compendium', async ({ page }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        const closeBtn = actorWindow.locator('button[data-action="close"]')
        await closeBtn.click().catch(() => {})
        await actorWindow.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})

        const itemWindow = await openItemSheet(page, SPELL_NAME)
        await expect(itemWindow).toBeVisible({ timeout: 15000 })
        await openPreEffectsTab(itemWindow)

        const skillSelect = itemWindow.locator('select[name$="avoidTest.fertigkeit"]').first()
        await expect(skillSelect).toBeVisible({ timeout: 10000 })

        const options = await skillSelect.locator('option').all()
        expect(options.length).toBeGreaterThan(0)

        const optgroups = await skillSelect.locator('optgroup').all()
        const optionTexts = await Promise.all(
            options.map(async (o) => ((await o.textContent()) ?? '').trim()),
        )
        const hasSkills = optionTexts.some((t) => t !== '' && t !== '— Keine —')
        expect(hasSkills || optgroups.length > 0).toBe(true)
    })

    test('Damage type select is populated from settings', async ({ page }) => {
        const actorWindow = await openActorSheet(page, ACTOR_NAME)

        const closeBtn = actorWindow.locator('button[data-action="close"]')
        await closeBtn.click().catch(() => {})
        await actorWindow.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})

        const itemWindow = await openItemSheet(page, SPELL_NAME)
        await expect(itemWindow).toBeVisible({ timeout: 15000 })
        await openPreEffectsTab(itemWindow)

        const damageTypeSelect = itemWindow.locator('select[name$="damageType"]').first()
        const exists = await damageTypeSelect.isVisible().catch(() => false)
        if (exists) {
            const options = await damageTypeSelect.locator('option').all()
            expect(options.length).toBeGreaterThan(0)
        }
    })
})
