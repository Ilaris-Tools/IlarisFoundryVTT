/**
 * E2E-044 – Edit-Sheet Information Architecture
 *
 * @spec openspec/changes/refine-edit-sheet-information-architecture/specs/edit-sheet-information-architecture/spec.md
 * @scenario Attached spell shows its configured automation without reconfiguration
 * @scenario Zone acts as a single-instance card inside Automatisierung
 * @scenario Base and form editors share parametrised partials
 *
 * Verifies the new edit-sheet information architecture:
 *   1. A spell that already contains Widerstandsprobe shows the section
 *   2. Zone add/remove behaves as a single card on a separate data path
 *   3. Structured spell-modification forms render through the shared partials
 */

import { expect, test } from '@playwright/test'
import {
    captureActorDefaultSnapshot,
    createE2ESession,
    foundryConfig,
    loginAndJoinWorld,
    openPreEffectsTab,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const FLUCH_NAME = 'Fluch des Gewürms'
const AEOLITUS_NAME = 'Aeolitus Windgebraus'
const IGNIFAXIUS_NAME = 'Ignifaxius Flammenstrahl'
const MANEUVER_NAME = 'Klingentanz'

test.describe('E2E-044 · Edit-Sheet Information Architecture', () => {
    let snapshot: any
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
            importedItemId = null
        }
        await restoreActorFromDefaultSnapshot(page, snapshot).catch(() => {})
    })

    async function importCompendiumItem(
        page: import('@playwright/test').Page,
        itemName: string,
        packPattern: string,
    ) {
        importedItemId = await page.evaluate(
            async ({ name, packPattern: pattern }) => {
                const packs = game.packs?.contents ?? []
                const itemPacks = packs.filter((p) => p.documentName === 'Item')
                const packMatcher = new RegExp(pattern, 'i')
                const spellPack = itemPacks.find((p) =>
                    packMatcher.test(`${p.metadata?.label ?? ''} ${p.collection ?? ''}`),
                )

                if (!spellPack) throw new Error(`Item compendium not found for ${pattern}`)

                const index = await spellPack.getIndex()
                const entry = index.find((e) => e.name === name)
                if (!entry) throw new Error(`Spell not found: ${name}`)

                const doc = await spellPack.getDocument(entry._id)
                const source = doc.toObject()
                delete source._id
                const [created] = await Item.createDocuments([source])
                return created?.id ?? null
            },
            { name: itemName, packPattern },
        )
        if (!importedItemId) throw new Error(`Failed to import ${itemName} from compendium`)
    }

    async function openImportedSpellSheet(
        page: import('@playwright/test').Page,
        spellName: string,
    ) {
        await page.evaluate((id) => {
            const item = game.items.get(id)
            if (!item?.sheet) throw new Error(`Imported item not found: ${id}`)
            item.sheet.render(true)
        }, importedItemId)

        const itemWindow = page
            .locator('.window-app, .application')
            .filter({ hasText: spellName })
            .last()
        await expect(itemWindow).toBeVisible({ timeout: 15000 })
        return itemWindow
    }

    test('pre-configured spell shows its active automation without reconfiguration', async () => {
        const page = session!.page
        await importCompendiumItem(page, FLUCH_NAME, 'zauberspruch')
        const itemWindow = await openImportedSpellSheet(page, FLUCH_NAME)
        await openPreEffectsTab(itemWindow)

        const card = itemWindow.locator('.pre-effects-list .pre-effect-card').first()
        // Fluch des Gewürms ships an active Widerstandsprobe with outcome payloads.
        await expect(card.locator('.avoid-test-section')).toBeVisible()
        await expect(card.locator('.resistance-outcomes-section')).toBeVisible()
        await expect(
            card.locator('input[name$=".resistanceOutcomes.failure.marker.id"]').first(),
        ).toBeVisible()
        // No zone is configured → the add-action is offered, no zone card.
        await expect(itemWindow.locator('.zone-card')).toHaveCount(0)
        await expect(itemWindow.locator('.add-zone-profile')).toBeVisible()
        await itemWindow.screenshot({ path: 'test-results/edit-sheet-configured-resistance.png' })
    })

    test('zone acts as a single-instance card: add and remove', async () => {
        const page = session!.page
        await importCompendiumItem(page, IGNIFAXIUS_NAME, 'zauberspruch')
        const itemWindow = await openImportedSpellSheet(page, IGNIFAXIUS_NAME)
        await openPreEffectsTab(itemWindow)

        await expect(itemWindow.locator('.zone-card')).toHaveCount(0)
        await itemWindow.locator('.add-zone-profile').click()

        const zoneCard = itemWindow.locator('.zone-card')
        await expect(zoneCard).toBeVisible()
        await expect(zoneCard.locator('select[name$=".shape"]')).toHaveValue('circle')
        await expect(zoneCard.locator('input[name$=".duration.remaining"]')).toHaveValue('1')

        await itemWindow.locator('.clear-zone-profile').click()
        await expect(itemWindow.locator('.zone-card')).toHaveCount(0)
        await expect(itemWindow.locator('.add-zone-profile')).toBeVisible()

        await itemWindow.screenshot({ path: 'test-results/edit-sheet-zone-add-remove.png' })

        await page.waitForFunction(
            (id) => (game.items.get(id) as any)?.system?.zone == null,
            importedItemId,
            { timeout: 10000 },
        )
    })

    test('structured spell-modification forms render through the shared partials', async () => {
        const page = session!.page
        await importCompendiumItem(page, AEOLITUS_NAME, 'zauberspruch')
        const itemWindow = await openImportedSpellSheet(page, AEOLITUS_NAME)
        await openPreEffectsTab(itemWindow)

        const modificationsArea = itemWindow.locator('.modifications-area')
        await modificationsArea.locator('> summary').click()
        const editor = modificationsArea.locator('.spell-modification-editor')
        await expect(editor).toBeVisible()

        const formCards = editor.locator('.spell-modification-card')
        expect(await formCards.count()).toBeGreaterThan(0)

        // Form zone override uses the shared parametrised zone-editor partial.
        await expect(editor.locator('select[name$=".zone.lifecycle"]').first()).toHaveValue(
            'persistent',
        )

        // Form pre-effects render through the shared pre-effect-card partial.
        const formPreEffects = editor.locator('.pre-effect-card')
        await expect(formPreEffects).toHaveCount(1)
        await expect(formPreEffects.first().locator('.avoid-test-section')).toBeVisible()
        await itemWindow.screenshot({ path: 'test-results/edit-sheet-form-partials.png' })
    })

    test('maneuver offers its trigger but no spell-only zone automation', async () => {
        const page = session!.page
        await importCompendiumItem(page, MANEUVER_NAME, 'man(?:ö|oe|o)ver')
        const itemWindow = await openImportedSpellSheet(page, MANEUVER_NAME)
        await openPreEffectsTab(itemWindow)

        await expect(itemWindow.locator('.sheet-area-header')).toHaveText([
            'Regeltext',
            'Automatisierung',
            'Strukturierte Zaubermodifikationen',
            'Erweitert',
        ])
        await expect(itemWindow.locator('.add-zone-profile')).toHaveCount(0)

        await itemWindow.locator('.add-automation-summary').click()
        const trigger = itemWindow.locator(
            '.add-automation-feature[data-feature="activationTrigger"]',
        )
        await expect(trigger).toBeVisible()
        await trigger.click()

        const addedCard = itemWindow.locator('.pre-effects-list .pre-effect-card').last()
        await expect(addedCard.locator('select[name$=".activation"]')).toHaveValue('onConfirmedHit')
        await page.waitForFunction(
            (id) =>
                ((game.items.get(id) as any)?.system?.preEffects ?? []).some(
                    (preEffect: any) => preEffect?.activation === 'onConfirmedHit',
                ),
            importedItemId,
            { timeout: 10000 },
        )
        await itemWindow.screenshot({ path: 'test-results/edit-sheet-maneuver-capability.png' })
    })
})
