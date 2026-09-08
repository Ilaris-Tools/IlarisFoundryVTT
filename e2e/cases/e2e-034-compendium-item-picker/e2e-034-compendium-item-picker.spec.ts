import { expect, Locator, Page, test } from '@playwright/test'

import { E2E_BASELINE } from '../../shared/baseline'
import {
    ActorDefaultSnapshot,
    captureActorDefaultSnapshot,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    restoreActorFromDefaultSnapshot,
    restoreFoundrySetting,
} from '../../shared/fixtures/foundry'

const HERO = E2E_BASELINE.actors.hero
const CREATURE = E2E_BASELINE.actors.npc

/** Choose real baseline content without depending on a particular item name or ID. */
async function findSource(page: Page, type: string) {
    return page.evaluate(async (itemType) => {
        const packs = [...game.packs]
            .filter((pack: any) => pack.documentName === 'Item' && pack.visible)
            .sort((a: any, b: any) => a.collection.localeCompare(b.collection))
        for (const pack of packs) {
            const index = await pack.getIndex({ fields: ['type'] })
            const entry = [...index]
                .filter((item: any) => item.type === itemType)
                .sort((a: any, b: any) => a.name.localeCompare(b.name))[0]
            if (!entry) continue
            const item = await pack.getDocument(entry._id)
            return {
                pack: pack.collection as string,
                key: `${pack.collection}:${entry._id}`,
                id: entry._id as string,
                source: item.toObject() as Record<string, any>,
            }
        }
        throw new Error(`No compendium item of type ${itemType} in the E2E baseline`)
    }, type)
}

async function actorItems(page: Page, actorName: string) {
    return page.evaluate(
        (name) => game.actors.getName(name).items.map((item: any) => item.toObject()),
        actorName,
    ) as Promise<Array<Record<string, any>>>
}

async function readyPicker(page: Page) {
    const picker = page.locator('.item-picker-dialog')
    await expect(picker).toBeVisible()
    await expect(picker.locator('.picker-results')).toHaveAttribute('aria-busy', 'false')
    return picker
}

async function openWeaponPicker(page: Page, sheet: Locator) {
    await sheet.locator('nav [data-tab="kampf"]').click()
    await sheet.locator('[data-action="itemCreate"][data-itemclass="nahkampfwaffe"]').click()
    return readyPicker(page)
}

async function chooseSource(picker: Locator, source: Awaited<ReturnType<typeof findSource>>) {
    await picker.locator('select[name="pack"]').selectOption(source.pack)
    await picker.locator('input[name="search"]').fill(source.source.name)
    const row = picker.locator(`[data-item-key="${source.key}"]`)
    await row.locator('input[name="item"]').check()
    await expect(picker.locator('[data-action="add"]')).toBeEnabled()
    return row
}

test.describe('E2E-034 Kompendium-Auswahl beim Hinzufügen', () => {
    test('Waffentyp und kombinierte Filter, Vorschau, Abbrechen, Schließen und ein vollständiger Import', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)
        const snapshot = await captureActorDefaultSnapshot(page, HERO)
        try {
            const source = await findSource(page, 'nahkampfwaffe')
            const before = await actorItems(page, HERO)
            const sheet = await openActorSheet(page, HERO)
            let picker = await openWeaponPicker(page, sheet)
            await expect(picker.locator('[data-action="add"]')).toBeDisabled()

            const resultTypes = await picker.locator('input[name="item"]').evaluateAll((radios) =>
                radios.map((radio) => {
                    const [packId, id] = (radio as HTMLInputElement).value.split(':')
                    return game.packs.get(packId).index.get(id)?.type
                }),
            )
            expect(resultTypes.length).toBeGreaterThan(0)
            expect(new Set(resultTypes)).toEqual(new Set(['nahkampfwaffe']))

            const row = await chooseSource(picker, source)
            const expectedKeys = await page.evaluate(
                ({ pack, name }) => {
                    const clean = (foundry as any).applications.ux.SearchFilter.cleanQuery
                    return [...game.packs.get(pack).index]
                        .filter(
                            (item: any) =>
                                item.type === 'nahkampfwaffe' &&
                                clean(item.name).includes(clean(name)),
                        )
                        .map((item: any) => `${pack}:${item._id}`)
                },
                { pack: source.pack, name: source.source.name },
            )
            const shownKeys = await picker
                .locator('input[name="item"]')
                .evaluateAll((radios) => radios.map((radio) => (radio as HTMLInputElement).value))
            expect(shownKeys.sort()).toEqual(expectedKeys.sort())
            expect(shownKeys.every((key) => key.startsWith(`${source.pack}:`))).toBe(true)

            // Preview must not create an actor item or modify the compendium document.
            await row.locator('[data-action="preview"]').click()
            const preview = page.locator('.application.sheet.item').last()
            await expect(preview).toBeVisible()
            await expect(preview.locator('input[name="name"]')).toHaveValue(source.source.name)
            expect(await actorItems(page, HERO)).toEqual(before)
            await preview.locator('[data-action="close"]').click()
            const unchangedSource = await page.evaluate(async ({ pack, id }) => {
                return (await game.packs.get(pack).getDocument(id)).toObject()
            }, source)
            expect(unchangedSource).toEqual(source.source)

            await picker.locator('input[name="search"]').fill('E2E-256-kein-solcher-Eintrag')
            await expect(picker.locator('input[name="item"]')).toHaveCount(0)
            await expect(picker.locator('[data-action="add"]')).toBeDisabled()
            await expect(picker.locator('[data-action="createBlank"]')).toBeEnabled()
            await picker.locator('[data-action="cancel"]').click()
            await expect(picker).toBeHidden()
            expect(await actorItems(page, HERO)).toEqual(before)

            picker = await openWeaponPicker(page, sheet)
            await picker.locator('.window-header [data-action="close"]').click()
            await expect(picker).toBeHidden()
            expect(await actorItems(page, HERO)).toEqual(before)

            picker = await openWeaponPicker(page, sheet)
            await chooseSource(picker, source)
            await picker.locator('[data-action="add"]').click()
            await expect(picker).toBeHidden()
            await expect
                .poll(async () => (await actorItems(page, HERO)).length)
                .toBe(before.length + 1)
            const added = (await actorItems(page, HERO)).filter(
                (item) => !before.some((existing) => existing._id === item._id),
            )
            expect(added).toHaveLength(1)
            expect(added[0]).toMatchObject({
                name: source.source.name,
                type: 'nahkampfwaffe',
                img: source.source.img,
                system: source.source.system,
                flags: source.source.flags,
            })
            const withoutIds = (effects: Array<Record<string, any>>) =>
                effects.map(({ _id, ...effect }) => effect)
            expect(withoutIds(added[0].effects)).toEqual(withoutIds(source.source.effects))
        } finally {
            await restoreActorFromDefaultSnapshot(page, snapshot)
        }
    })

    for (const scenario of [
        { type: 'fertigkeit', context: 'freiesTalent', profan: true },
        { type: 'talent', context: 'freiesTalent', profan: true },
        { type: 'uebernatuerlicheFertigkeit', context: 'uebernatFreiesTalent', profan: false },
    ]) {
        test(`Kreatur: ${scenario.type} wird genau einmal als freiesTalent übernommen`, async ({
            page,
        }) => {
            await loginAndJoinWorld(page, foundryConfig)
            const snapshot = await captureActorDefaultSnapshot(page, CREATURE)
            try {
                const source = await findSource(page, scenario.type)
                const before = await actorItems(page, CREATURE)
                await openActorSheet(page, CREATURE)
                const sheet = page.locator('.application.kreaturen').last()
                await sheet
                    .locator('select[name="system.additemtype"]')
                    .selectOption(scenario.context)
                const add = sheet.locator('[data-action="itemCreate"]')
                await expect(add).toHaveAttribute('data-itemclass', scenario.context)
                await add.click()
                const picker = await readyPicker(page)
                await chooseSource(picker, source)
                await picker.locator('[data-action="add"]').click()
                await expect(picker).toBeHidden()
                const added = (await actorItems(page, CREATURE)).filter(
                    (item) => !before.some((existing) => existing._id === item._id),
                )
                expect(added).toHaveLength(1)
                expect(added[0]).toMatchObject({
                    name: source.source.name,
                    type: 'freiesTalent',
                    img: source.source.img,
                    system: { profan: scenario.profan },
                })
            } finally {
                await restoreActorFromDefaultSnapshot(page, snapshot)
            }
        })
    }

    test('Kreatur: eigener Vorteil erstellt genau eine Eigenschaft', async ({ page }) => {
        await loginAndJoinWorld(page, foundryConfig)
        const snapshot = await captureActorDefaultSnapshot(page, CREATURE)
        try {
            const before = await actorItems(page, CREATURE)
            await openActorSheet(page, CREATURE)
            const sheet = page.locator('.application.kreaturen').last()
            await sheet.locator('select[name="system.additemtype"]').selectOption('vorteil')
            const add = sheet.locator('[data-action="itemCreate"]')
            await expect(add).toHaveAttribute('data-itemclass', 'vorteil')
            await add.click()
            const picker = await readyPicker(page)
            await picker.locator('[data-action="createBlank"]').click()
            await expect(picker).toBeHidden()
            await expect(page.locator('.application.sheet.item.eigenschaft')).toBeVisible()
            const added = (await actorItems(page, CREATURE)).filter(
                (item) => !before.some((existing) => existing._id === item._id),
            )
            expect(added).toHaveLength(1)
            expect(added[0].type).toBe('eigenschaft')
        } finally {
            await restoreActorFromDefaultSnapshot(page, snapshot)
        }
    })

    test('Besitzender Spieler sieht keine gesperrten Kompendien oder deren Einträge', async ({
        browser,
    }) => {
        const gmContext = await browser.newContext()
        const playerContext = await browser.newContext()
        const gmPage = await gmContext.newPage()
        const playerPage = await playerContext.newPage()
        let configuration: { namespace: string; key: string; value: unknown } | null = null
        let actorSnapshot: ActorDefaultSnapshot | null = null
        try {
            await loginAndJoinWorld(gmPage, foundryConfig)
            actorSnapshot = await captureActorDefaultSnapshot(gmPage, HERO)
            const source = await findSource(gmPage, 'nahkampfwaffe')
            configuration = await gmPage.evaluate(() => ({
                namespace: 'core',
                key: 'compendiumConfiguration',
                value: foundry.utils.deepClone(
                    game.settings.get('core', 'compendiumConfiguration'),
                ),
            }))
            // v14 CompendiumCollection.configure/ownership; restore the exact setting in finally.
            // https://foundryvtt.com/api/v14/classes/foundry.documents.collections.CompendiumCollection.html
            await gmPage.evaluate(async (packId) => {
                await game.packs.get(packId).configure({
                    ownership: { PLAYER: 'NONE', TRUSTED: 'NONE', ASSISTANT: 'NONE' },
                })
            }, source.pack)
            await loginAndJoinWorld(playerPage, {
                ...foundryConfig,
                username: process.env.E2E_PLAYER_USER ?? E2E_BASELINE.users.player,
                password: process.env.E2E_PLAYER_PASSWORD,
            })
            const before = await actorItems(playerPage, HERO)
            expect(
                await playerPage.evaluate((name) => game.actors.getName(name).isOwner, HERO),
            ).toBe(true)
            expect(
                await playerPage.evaluate(
                    (id) => game.packs.get(id)?.visible ?? false,
                    source.pack,
                ),
            ).toBe(false)
            const sheet = await openActorSheet(playerPage, HERO)
            const picker = await openWeaponPicker(playerPage, sheet)
            await expect(
                picker.locator(`select[name="pack"] option[value="${source.pack}"]`),
            ).toHaveCount(0)
            await expect(
                picker.locator(`input[name="item"][value^="${source.pack}:"]`),
            ).toHaveCount(0)
            await picker.locator('input[name="search"]').fill(source.source.name)
            await expect(picker.locator(`input[name="item"][value="${source.key}"]`)).toHaveCount(0)
            await picker.locator('[data-action="cancel"]').click()
            await expect(picker).toBeHidden()
            expect(await actorItems(playerPage, HERO)).toEqual(before)

            // The same player can still import a readable spell into their own actor.
            const readableSource = await findSource(playerPage, 'zauber')
            await sheet.locator('nav [data-tab="uebernatuerlich"]').click()
            await sheet.locator('[data-action="itemCreate"][data-itemclass="zauber"]').click()
            const readablePicker = await readyPicker(playerPage)
            await chooseSource(readablePicker, readableSource)
            await readablePicker.locator('[data-action="add"]').click()
            await expect(readablePicker).toBeHidden()
            const added = (await actorItems(playerPage, HERO)).filter(
                (item) => !before.some((existing) => existing._id === item._id),
            )
            expect(added).toHaveLength(1)
            expect(added[0]).toMatchObject({ name: readableSource.source.name, type: 'zauber' })
        } finally {
            try {
                try {
                    if (actorSnapshot) await restoreActorFromDefaultSnapshot(gmPage, actorSnapshot)
                } finally {
                    if (configuration) await restoreFoundrySetting(gmPage, configuration)
                }
            } finally {
                await playerContext.close()
                await gmContext.close()
            }
        }
    })
})
