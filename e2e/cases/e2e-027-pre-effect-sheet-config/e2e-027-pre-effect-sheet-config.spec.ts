/**
 * E2E-027 – Pre-Effect: Sheet Configuration
 *
 * @spec openspec/changes/refine-edit-sheet-information-architecture/specs/edit-sheet-information-architecture/spec.md
 * @scenario Inactive automation features are not rendered
 * @scenario Automation features are added consciously
 * @scenario Add and delete pre-effect entry
 * @scenario AvoidTest skill select populated from compendium
 * @scenario Damage type select populated from settings
 *
 * Verifies the information architecture of pre-effect authoring on an
 * uebernatuerlich item sheet:
 *   1. Inactive features (Widerstandsprobe) are NOT rendered until added
 *   2. The add-menu configures them; the block appears and persists
 *   3. Existing automation stays visible (regression)
 */

import { expect, test } from '@playwright/test'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    createE2ESession,
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
    let session: Awaited<ReturnType<typeof createE2ESession>> | undefined

    test.beforeAll(async ({ browser }) => {
        session = await createE2ESession(browser)
    })

    test.afterAll(async () => {
        session?.close()
    })

    test.beforeEach(async () => {
        const page = session!.page
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

    test.afterEach(async () => {
        const page = session!.page
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

    async function addAutomationFeature(
        itemWindow: import('@playwright/test').Locator,
        feature: string,
    ) {
        await itemWindow.locator('.add-automation-summary').click()
        await itemWindow.locator(`.add-automation-feature[data-feature="${feature}"]`).click()
        await itemWindow.locator('.pre-effects-list .pre-effect-card').last().waitFor()
    }

    test('Pre-effects tab is accessible, active automation is visible, inactive is hidden', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)

        const preEffectsSection = itemWindow.locator('.pre-effects-section')
        await expect(preEffectsSection).toBeVisible({ timeout: 10000 })

        const preEffectCards = preEffectsSection.locator('.pre-effects-list .pre-effect-card')
        const cardCount = await preEffectCards.count()
        expect(cardCount).toBeGreaterThan(0)

        // Ignifaxius carries a damage effect → Wirkungen block is rendered.
        await expect(preEffectCards.first().locator('.change-card')).toBeVisible()

        // Ignifaxius has no Widerstandsprobe → section must NOT be rendered.
        await expect(preEffectCards.first().locator('.avoid-test-section')).toHaveCount(0)

        await preEffectsSection.locator('.add-automation-summary').click()
        await expect(
            preEffectsSection.locator('.add-automation-feature[data-feature="activationTrigger"]'),
        ).toHaveCount(0)

        const addButton = preEffectsSection.locator('.add-pre-effect')
        await expect(addButton).toBeVisible()
    })

    test('add-flow reveals Widerstandsprobe and outcome panels only when configured', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        await addAutomationFeature(itemWindow, 'resistance')

        const card = itemWindow.locator('.pre-effects-list .pre-effect-card').last()
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
        await expect(
            failure.locator('input[name$=".resistanceOutcomes.failure.enabled"]'),
        ).toBeVisible()

        await failure.getByText('Eigene Wirkung verwenden', { exact: true }).click()
        const accordion = card.locator('.pre-effect-accordion')
        if ((await accordion.getAttribute('open')) === null) {
            await accordion.locator('> summary').click()
        }
        await expect(
            card
                .locator('.outcome-payload[data-outcome="failure"]')
                .locator('input[name$=".marker.id"]'),
        ).toBeVisible()
        await itemWindow.screenshot({ path: 'test-results/resistance-outcomes-editor.png' })
    })

    test('outcome panels remain legible in Foundry light and dark application themes', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        await addAutomationFeature(itemWindow, 'resistance')

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
                const card = itemWindow.locator('.pre-effects-list .pre-effect-card').last()
                const outcomes = card.locator('.resistance-outcomes-section')
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

    test('AvoidTest skill dropdown is populated from compendium', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        await addAutomationFeature(itemWindow, 'resistance')

        const skillSelect = itemWindow
            .locator('.pre-effects-list .pre-effect-card')
            .last()
            .locator('select[name$="avoidTest.fertigkeit"]')
            .first()
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

    test('AvoidTest talent dropdown persists a compatible profane talent', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        await addAutomationFeature(itemWindow, 'resistance')

        const card = itemWindow.locator('.pre-effects-list .pre-effect-card').last()
        const skillSelect = card.locator('select[name$="avoidTest.fertigkeit"]').first()
        await expect(card.locator('select[name$="avoidTest.talent"]').first()).toBeVisible({
            timeout: 10000,
        })

        const skill = await skillSelect
            .locator('option')
            .evaluateAll((options) => options.map((option: any) => option.value).find(Boolean))
        if (!skill) test.skip(true, 'No profane skill option available')

        await skillSelect.selectOption(skill)
        await page.waitForFunction(
            ({ itemId, skill }) => {
                const item = game.items.get(itemId) as any
                const inEntries = (entries: any[]) =>
                    entries?.some((p: any) => p?.avoidTest?.fertigkeit === skill) ?? false
                const modifications = item?.system?.spellModifications ?? []
                return (
                    inEntries(item?.system?.preEffects) ||
                    modifications.some((m: any) => inEntries(m?.preEffects))
                )
            },
            { itemId: importedItemId, skill },
        )
        const talentSelect = itemWindow
            .locator('.pre-effects-list .pre-effect-card')
            .last()
            .locator('select[name$="avoidTest.talent"]')
            .first()
        await expect(talentSelect).toBeVisible({ timeout: 10000 })
        const talent = await talentSelect
            .locator('option')
            .evaluateAll((options) => options.map((option: any) => option.value).find(Boolean))
        if (!talent) test.skip(true, 'No compatible profane talent option available')

        await talentSelect.selectOption(talent)
        await page.waitForFunction(
            ({ itemId, talent }) => {
                const item = game.items.get(itemId) as any
                const inEntries = (entries: any[]) =>
                    entries?.some((p: any) => p?.avoidTest?.talent === talent) ?? false
                const modifications = item?.system?.spellModifications ?? []
                return (
                    inEntries(item?.system?.preEffects) ||
                    modifications.some((m: any) => inEntries(m?.preEffects))
                )
            },
            { itemId: importedItemId, talent },
        )

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const reopenedWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(reopenedWindow)
        await expect(
            reopenedWindow
                .locator('.pre-effects-list .pre-effect-card')
                .last()
                .locator('select[name$="avoidTest.talent"]')
                .first(),
        ).toHaveValue(talent)
    })

    test('Damage type select is populated from settings', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)

        const damageTypeSelect = itemWindow
            .locator('.pre-effects-list .pre-effect-card')
            .first()
            .locator('select[name$="damageType"]')
            .first()
        await expect(damageTypeSelect).toBeVisible({ timeout: 10000 })
        const options = await damageTypeSelect.locator('option').all()
        expect(options.length).toBeGreaterThan(0)
    })

    test('summon-item source autocomplete follows and persists its selected source kind', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        await addAutomationFeature(itemWindow, 'summonItem')

        const card = itemWindow.locator('.pre-effects-list .pre-effect-card').last()
        await card.locator('.pre-effect-accordion > summary').click()
        const sourceKind = card.locator('select[name$="summonItem.sourceKind"]').first()
        const sourceInput = card.locator('input[name$="summonItem.sourceUuid"]').first()
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
        await page.waitForFunction(
            ({ id }) => {
                const preEffects = Object.values(
                    game.items.get(id)?.system?.preEffects ?? {},
                ) as any[]
                return preEffects.some((p) => p?.summonItem?.sourceKind === 'gegenstand')
            },
            { id: importedItemId },
            { timeout: 10000 },
        )

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const reopenedWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(reopenedWindow)
        const reopenedCard = reopenedWindow.locator('.pre-effects-list .pre-effect-card').last()
        await reopenedCard.locator('.pre-effect-accordion > summary').click()
        const reopenedInput = reopenedCard.locator('input[name$="summonItem.sourceUuid"]').first()
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
                const preEffects = Object.values(
                    game.items.get(id)?.system?.preEffects ?? {},
                ) as any[]
                return preEffects.some(
                    (p) =>
                        p?.summonItem?.sourceKind === 'gegenstand' &&
                        p?.summonItem?.sourceUuid === sourceUuid,
                )
            },
            { id: importedItemId, sourceUuid: ringUuid },
            { timeout: 10000 },
        )

        await page.evaluate((id) => game.items.get(id)?.sheet?.close(), importedItemId)
        const finalWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(finalWindow)
        await expect(
            finalWindow
                .locator('.pre-effects-list .pre-effect-card')
                .last()
                .locator('select[name$="summonItem.sourceKind"]')
                .first(),
        ).toHaveValue('gegenstand')
        await expect(
            finalWindow
                .locator('.pre-effects-list .pre-effect-card')
                .last()
                .locator('input[name$="summonItem.sourceUuid"]')
                .first(),
        ).toHaveValue(ringUuid)
        const finalCard = finalWindow.locator('.pre-effects-list .pre-effect-card').last()
        await finalCard.locator('.pre-effect-accordion > summary').click()
        await finalCard.locator('.summon-item-section').screenshot({
            path: 'test-results/summon-item-source-kind-persisted.png',
        })
    })

    test('adds, persists, and deletes a pre-effect entry via add-flow', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        const cards = itemWindow.locator('.pre-effects-list .pre-effect-card')
        const initialCount = await cards.count()

        await addAutomationFeature(itemWindow, 'damage')
        await expect(cards).toHaveCount(initialCount + 1)
        const addedCard = cards.last()
        await addedCard.locator('.add-change').click()
        await expect(addedCard.locator('.change-card')).toHaveCount(2)
        const damageType = addedCard.locator('select[name$="damageType"]').first()
        await damageType.selectOption('FEUER')
        const updatedCard = itemWindow.locator('.pre-effects-list .pre-effect-card').last()
        if ((await updatedCard.locator('.pre-effect-accordion').getAttribute('open')) === null) {
            await updatedCard.locator('.pre-effect-accordion > summary').click()
        }
        const duration = updatedCard.locator('input[name$="baseDuration"]')
        await duration.fill('9')
        await duration.dispatchEvent('change')

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
        const reopenedCard = reopenedWindow.locator('.pre-effects-list .pre-effect-card').last()
        await expect(reopenedCard.locator('input[name$="baseDuration"]')).toHaveValue('9')
        if ((await reopenedCard.locator('.pre-effect-accordion').getAttribute('open')) === null) {
            await reopenedCard.locator('.pre-effect-accordion > summary').click()
        }
        await expect(reopenedCard.locator('select[name$="damageType"]').first()).toHaveValue(
            'FEUER',
        )

        await reopenedCard.locator('.delete-pre-effect').click()
        await expect(reopenedWindow.locator('.pre-effects-list .pre-effect-card')).toHaveCount(
            initialCount,
        )
    })

    test('adds, persists, reopens, and edits an Ilaris modifier with selectors', async () => {
        const page = session!.page
        const itemWindow = await openImportedSpellSheet(page)
        await openPreEffectsTab(itemWindow)
        const card = itemWindow.locator('.pre-effects-list .pre-effect-card').first()
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
            .locator('.pre-effects-list .pre-effect-card')
            .first()
            .locator('.ilaris-modifier-card')
            .last()
        await expect(reopenedModifier.locator('select[name$=".target"]')).toHaveValue('at')
        await expect(reopenedModifier.locator('input[name$=".value"]')).toHaveValue('2')
        await expect(reopenedModifier.locator('input[name$=".selector.fertigkeit"]')).toHaveValue(
            'Klingenwaffen',
        )

        await reopenedModifier.locator('input[name$=".value"]').fill('3')
        await reopenedModifier.screenshot({
            path: 'test-results/ilaris-modifier-selector-persisted.png',
        })
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
