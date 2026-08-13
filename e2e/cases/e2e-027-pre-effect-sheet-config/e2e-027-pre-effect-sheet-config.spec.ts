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

    async function openImportedSpellSheet(page: import('@playwright/test').Page) {
        // Open via Foundry API using the imported world item id (avoids directory flakiness).
        await page.evaluate((id) => {
            const item = game.items.get(id)
            if (!item?.sheet) throw new Error(`Imported item not found: ${id}`)
            item.sheet.render(true)
        }, importedItemId)

        const itemWindow = page
            .locator('.window-app, .application')
            .filter({ hasText: SPELL_NAME })
            .last()
        await expect(itemWindow).toBeVisible({ timeout: 15000 })
        return itemWindow
    }

    test('Pre-effects tab is accessible and has expected structure', async ({ page }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)

        // Pre-effects is a stacked PART (`.pre-effects-section`), not a tab panel.
        const preEffectsSection = itemWindow.locator('.pre-effects-section')
        await expect(preEffectsSection).toBeVisible({ timeout: 10000 })

        const preEffectCards = preEffectsSection.locator('.pre-effect-card')
        const cardCount = await preEffectCards.count()
        expect(cardCount).toBeGreaterThan(0)

        const addButton = preEffectsSection.locator('.add-pre-effect')
        await expect(addButton).toBeVisible()
    })

    test('outcome panels follow Widerstand and reveal only when enabled', async ({ page }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        const card = itemWindow.locator('.pre-effect-card').first()
        const resistance = card.locator('.avoid-test-section')
        const outcomes = card.locator('.resistance-outcomes-section')
        await expect(resistance).toBeVisible()
        await expect(outcomes).toBeVisible()

        const ordered = await card.evaluate((element) => {
            const normal = element.querySelector('input[name$=".baseDuration"]')
            const resistanceSection = element.querySelector('.avoid-test-section')
            const outcomeSection = element.querySelector('.resistance-outcomes-section')
            return Boolean(
                normal &&
                resistanceSection &&
                outcomeSection &&
                normal.compareDocumentPosition(resistanceSection) &
                    Node.DOCUMENT_POSITION_FOLLOWING &&
                resistanceSection.compareDocumentPosition(outcomeSection) &
                    Node.DOCUMENT_POSITION_FOLLOWING,
            )
        })
        expect(ordered).toBe(true)

        const failure = outcomes.locator('.outcome-payload[data-outcome="failure"]')
        const success = outcomes.locator('.outcome-payload[data-outcome="success"]')
        await expect(failure).toContainText('Bei misslungener Widerstandsprobe')
        await expect(success).toContainText('Bei gelungener Widerstandsprobe')
        await expect(failure.locator('input[name$=".marker.id"]')).toBeHidden()

        await failure.locator('input[name$=".resistanceOutcomes.failure.enabled"]').check()
        await expect(failure.locator('input[name$=".marker.id"]')).toBeVisible()
        await itemWindow.screenshot({ path: 'test-results/resistance-outcomes-editor.png' })
    })

    test('outcome panels remain legible in Foundry light and dark application themes', async ({
        page,
    }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        const savedUiConfig = await page.evaluate(() =>
            foundry.utils.deepClone(game.settings.get('core', 'uiConfig')),
        )

        try {
            for (const theme of ['light', 'dark']) {
                await page.evaluate(
                    async ({ config, colorScheme }) => {
                        await game.settings.set('core', 'uiConfig', {
                            ...config,
                            colorScheme: {
                                ...(config.colorScheme ?? {}),
                                applications: colorScheme,
                            },
                        })
                    },
                    { config: savedUiConfig, colorScheme: theme },
                )
                await expect(page.locator(`body.theme-${theme}`)).toBeVisible()
                const outcomes = itemWindow.locator('.resistance-outcomes-section')
                await expect(outcomes).toBeVisible()
                await outcomes.scrollIntoViewIfNeeded()
                await itemWindow.screenshot({
                    path: `test-results/resistance-outcomes-editor-${theme}.png`,
                })
            }
        } finally {
            await page.evaluate(
                (config) => game.settings.set('core', 'uiConfig', config),
                savedUiConfig,
            )
        }
    })

    test('AvoidTest skill dropdown is populated from compendium', async ({ page }) => {
        const itemWindow = await openImportedSpellSheet(page)
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
        expect(optionTexts.some((text) => text.includes('uebernatuerlicheFertigkeit'))).toBe(false)
    })

    test('AvoidTest talent dropdown persists a compatible profane talent', async ({ page }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)

        const skillSelect = itemWindow.locator('select[name$="avoidTest.fertigkeit"]').first()
        const talentSelect = itemWindow.locator('select[name$="avoidTest.talent"]').first()
        await expect(talentSelect).toBeVisible({ timeout: 10000 })

        const skill = await skillSelect
            .locator('option')
            .evaluateAll((options) => options.map((option: any) => option.value).find(Boolean))
        if (!skill) test.skip(true, 'No profane skill option available')

        await skillSelect.selectOption(skill)
        await skillSelect.dispatchEvent('change')
        await page.waitForTimeout(250)
        const talent = await talentSelect
            .locator('option')
            .evaluateAll((options) => options.map((option: any) => option.value).find(Boolean))
        if (!talent) test.skip(true, 'No compatible profane talent option available')

        await talentSelect.selectOption(talent)
        await talentSelect.dispatchEvent('change')
        await page.waitForTimeout(250)

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const reopenedWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(reopenedWindow)
        await expect(
            reopenedWindow.locator('select[name$="avoidTest.talent"]').first(),
        ).toHaveValue(talent)
    })

    test('Damage type select is populated from settings', async ({ page }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)

        const damageTypeSelect = itemWindow.locator('select[name$="damageType"]').first()
        await expect(damageTypeSelect).toBeVisible({ timeout: 10000 })
        const options = await damageTypeSelect.locator('option').all()
        expect(options.length).toBeGreaterThan(0)
    })

    test('summon-item source autocomplete follows and persists its selected source kind', async ({
        page,
    }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)

        const sourceKind = itemWindow.locator('select[name$="summonItem.sourceKind"]').first()
        const sourceInput = itemWindow.locator('input[name$="summonItem.sourceUuid"]').first()
        await expect(sourceKind).toHaveValue('waffe')
        await expect(sourceInput).toBeVisible({ timeout: 10000 })
        await expect(sourceInput).toHaveAttribute('list', 'ilaris-summon-item-sources-waffe')
        const phexUuid = await itemWindow
            .locator('#ilaris-summon-item-sources-waffe option')
            .evaluateAll((options) => {
                const phex = options.find((option: any) =>
                    option.getAttribute('label')?.includes('Phexens Wurfstern'),
                )
                return phex?.getAttribute('value') ?? ''
            })
        expect(phexUuid).toBe('Compendium.Ilaris.waffen.Item.C9Qy0anjBUWn9TUw')

        await sourceKind.selectOption('gegenstand')
        await sourceKind.dispatchEvent('change')
        await page.waitForFunction(
            ({ id }) => {
                const preEffect = Object.values(
                    game.items.get(id)?.system?.preEffects ?? {},
                )[0] as any
                return preEffect?.summonItem?.sourceKind === 'gegenstand'
            },
            { id: importedItemId },
            { timeout: 10000 },
        )

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const reopenedWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(reopenedWindow)
        const reopenedInput = reopenedWindow.locator('input[name$="summonItem.sourceUuid"]').first()
        await expect(reopenedInput).toHaveAttribute('list', 'ilaris-summon-item-sources-gegenstand')
        const ringUuid = await reopenedWindow
            .locator('#ilaris-summon-item-sources-gegenstand option')
            .evaluateAll((options) => {
                const ring = options.find((option: any) =>
                    option.getAttribute('label')?.includes('Firuns Rings'),
                )
                return ring?.getAttribute('value') ?? ''
            })
        expect(ringUuid).toBe('Compendium.Ilaris.gegenstande.Item.nzMDgayAm0lz5QZP')

        await reopenedInput.fill(ringUuid)
        await reopenedInput.dispatchEvent('change')
        await page.waitForFunction(
            ({ id, sourceUuid }) => {
                const preEffect = Object.values(
                    game.items.get(id)?.system?.preEffects ?? {},
                )[0] as any
                return (
                    preEffect?.summonItem?.sourceKind === 'gegenstand' &&
                    preEffect?.summonItem?.sourceUuid === sourceUuid
                )
            },
            { id: importedItemId, sourceUuid: ringUuid },
            { timeout: 10000 },
        )

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const finalWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(finalWindow)
        await expect(
            finalWindow.locator('select[name$="summonItem.sourceKind"]').first(),
        ).toHaveValue('gegenstand')
        await expect(
            finalWindow.locator('input[name$="summonItem.sourceUuid"]').first(),
        ).toHaveValue(ringUuid)
    })

    test('adds, persists, and deletes a pre-effect entry', async ({ page }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        const cards = itemWindow.locator('.pre-effect-card')
        const initialCount = await cards.count()

        await itemWindow.locator('.add-pre-effect').click()
        await expect(cards).toHaveCount(initialCount + 1)
        const addedCard = cards.last()
        await addedCard.locator('.add-change').click()
        await expect(addedCard.locator('.change-card')).toHaveCount(1)
        const duration = addedCard.locator('input[name$="baseDuration"]')
        await duration.fill('9')
        await duration.dispatchEvent('change')
        const damageType = addedCard.locator('select[name$="damageType"]')
        await damageType.selectOption('FEUER')
        await damageType.dispatchEvent('change')

        await page.waitForFunction(
            ({ id, count }) => {
                const preEffects = game.items.get(id)?.system?.preEffects ?? []
                return Object.values(preEffects).length === count
            },
            { id: importedItemId, count: initialCount + 1 },
            { timeout: 10000 },
        )
        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        await expect(itemWindow).toBeHidden({ timeout: 10000 })
        const reopenedWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(reopenedWindow)
        const reopenedCard = reopenedWindow.locator('.pre-effect-card').last()
        await expect(reopenedCard.locator('input[name$="baseDuration"]')).toHaveValue('9')
        await expect(reopenedCard.locator('select[name$="damageType"]')).toHaveValue('FEUER')

        await reopenedCard.locator('.delete-pre-effect').click()
        await expect(reopenedWindow.locator('.pre-effect-card')).toHaveCount(initialCount)
    })

    test('adds, persists, reopens, and edits an Ilaris modifier with selectors', async ({
        page,
    }) => {
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        const card = itemWindow.locator('.pre-effect-card').first()
        const modifiers = card.locator('.ilaris-modifier-card')
        const initialCount = await modifiers.count()

        await card.locator('.add-ilaris-modifier').click()
        await expect(modifiers).toHaveCount(initialCount + 1)
        const modifier = modifiers.last()
        await modifier.locator('select[name$=".phase"]').selectOption('roll')
        await modifier.locator('select[name$=".target"]').selectOption('at')
        await modifier.locator('input[name$=".value"]').fill('2')
        await modifier.locator('select[name$=".stacking"]').selectOption('strongest-supernatural')
        await modifier.locator('input[name$=".selector.fertigkeit"]').fill('Klingenwaffen')
        await modifier.locator('input[name$=".selector.fertigkeit"]').dispatchEvent('change')

        await page.waitForFunction(
            ({ id, count }) => {
                const preEffects = game.items.get(id)?.system?.preEffects ?? []
                const effect = Object.values(preEffects)[0] as any
                return Object.values(effect?.ilarisModifiers ?? {}).length === count
            },
            { id: importedItemId, count: initialCount + 1 },
            { timeout: 10000 },
        )

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const reopenedWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(reopenedWindow)
        const reopenedModifier = reopenedWindow
            .locator('.pre-effect-card')
            .first()
            .locator('.ilaris-modifier-card')
            .last()
        await expect(reopenedModifier.locator('select[name$=".target"]')).toHaveValue('at')
        await expect(reopenedModifier.locator('input[name$=".value"]')).toHaveValue('2')
        await expect(reopenedModifier.locator('input[name$=".selector.fertigkeit"]')).toHaveValue(
            'Klingenwaffen',
        )

        await reopenedModifier.locator('input[name$=".value"]').fill('3')
        await reopenedModifier.locator('input[name$=".value"]').dispatchEvent('change')
        await page.waitForFunction(
            ({ id }) => {
                const preEffects = game.items.get(id)?.system?.preEffects ?? []
                const effect = Object.values(preEffects)[0] as any
                const entries = Object.values(effect?.ilarisModifiers ?? {}) as any[]
                return entries.at(-1)?.value === '3'
            },
            { id: importedItemId },
            { timeout: 10000 },
        )
    })
})
