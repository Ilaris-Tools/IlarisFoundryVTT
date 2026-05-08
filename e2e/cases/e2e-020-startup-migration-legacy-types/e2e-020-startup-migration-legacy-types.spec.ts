import { expect, test } from '@playwright/test'

import { foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'E2E Migration Legacy Actor'
const WORLD_ITEM_NAME = 'E2E Migration Legacy World Item'
const FORCED_OLD_SCHEMA_VERSION = '13.1.0'

test.describe('E2E-020 Startup Migration Legacy Types', () => {
    let actorId: string | null = null
    let worldItemId: string | null = null
    let originalSchemaVersion: string | null = null

    test.afterEach(async ({ page }) => {
        await page.evaluate(
            async ({ actorIdToDelete, worldItemIdToDelete, schemaVersionToRestore }) => {
                if (actorIdToDelete) {
                    const actor = (game as any).actors?.get(actorIdToDelete)
                    if (actor) await actor.delete()
                }

                if (worldItemIdToDelete) {
                    const worldItem = (game as any).items?.get(worldItemIdToDelete)
                    if (worldItem) await worldItem.delete()
                }

                if (schemaVersionToRestore) {
                    await (game as any).settings.set(
                        'Ilaris',
                        'worldSchemaVersion',
                        schemaVersionToRestore,
                    )
                }
            },
            {
                actorIdToDelete: actorId,
                worldItemIdToDelete: worldItemId,
                schemaVersionToRestore: originalSchemaVersion,
            },
        )

        actorId = null
        worldItemId = null
        originalSchemaVersion = null
    })

    test('migrates legacy world and actor item types on startup when schema is old', async ({
        page,
    }) => {
        await loginAndJoinWorld(page, foundryConfig)

        const setup = await page.evaluate(
            async ({ actorName, worldItemName, forcedOldSchema }) => {
                const existingActor = (game as any).actors?.getName(actorName)
                if (existingActor) await existingActor.delete()

                const existingWorldItem = (game as any).items?.find(
                    (item: any) => item.name === worldItemName,
                )
                if (existingWorldItem) await existingWorldItem.delete()

                const previousSchemaVersion =
                    (game as any).settings.get('Ilaris', 'worldSchemaVersion') ?? '0.0.0'

                const actor = await (globalThis as any).Actor.create({
                    name: actorName,
                    type: 'held',
                })

                const [embeddedItem] = await actor.createEmbeddedDocuments('Item', [
                    {
                        name: 'Legacy Freie Fertigkeit',
                        type: 'freieFertigkeit',
                        system: {
                            stufe: '2',
                            gruppe: '1',
                        },
                    },
                ])

                await actor.updateEmbeddedDocuments('Item', [
                    {
                        _id: embeddedItem.id,
                        type: 'freie_fertigkeit',
                    },
                ])

                const worldItem = await (globalThis as any).Item.create({
                    name: worldItemName,
                    type: 'freieFertigkeit',
                    system: {
                        stufe: '3',
                        gruppe: '1',
                    },
                })

                await worldItem.update({ type: 'freie_fertigkeit' })

                await (game as any).settings.set('Ilaris', 'worldSchemaVersion', forcedOldSchema)

                return {
                    actorId: actor.id as string,
                    worldItemId: worldItem.id as string,
                    originalSchemaVersion: previousSchemaVersion as string,
                }
            },
            {
                actorName: ACTOR_NAME,
                worldItemName: WORLD_ITEM_NAME,
                forcedOldSchema: FORCED_OLD_SCHEMA_VERSION,
            },
        )

        actorId = setup.actorId
        worldItemId = setup.worldItemId
        originalSchemaVersion = setup.originalSchemaVersion

        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForURL(/\/game/, { timeout: 60000 })
        await page.waitForSelector('#chat-log, #ui-left', { timeout: 45000 })
        await page.waitForFunction(() => typeof game !== 'undefined' && game.ready, undefined, {
            timeout: 30000,
        })

        // Migration läuft asynchron im ready-Hook. Daher explizit warten,
        // bis worldSchemaVersion nicht mehr auf der erzwungen alten Version steht.
        await page.waitForFunction(
            (forcedOldSchema: string) => {
                const schemaVersion = (game as any).settings.get('Ilaris', 'worldSchemaVersion')
                return schemaVersion && schemaVersion !== forcedOldSchema
            },
            FORCED_OLD_SCHEMA_VERSION,
            { timeout: 30000 },
        )

        const migratedState = await page.evaluate(
            ({ migratedActorId, migratedWorldItemId }) => {
                const actor = (game as any).actors?.get(migratedActorId)
                const embedded = actor?.items?.find(
                    (item: any) => item.name === 'Legacy Freie Fertigkeit',
                )

                const worldItem = (game as any).items?.get(migratedWorldItemId)

                return {
                    schemaVersion: (game as any).settings.get(
                        'Ilaris',
                        'worldSchemaVersion',
                    ) as string,
                    embeddedType: embedded?.type ?? null,
                    embeddedStufeType: typeof embedded?.system?.stufe,
                    embeddedGruppeType: typeof embedded?.system?.gruppe,
                    worldItemType: worldItem?.type ?? null,
                    worldItemStufeType: typeof worldItem?.system?.stufe,
                    worldItemGruppeType: typeof worldItem?.system?.gruppe,
                }
            },
            {
                migratedActorId: actorId,
                migratedWorldItemId: worldItemId,
            },
        )

        expect(migratedState.schemaVersion).not.toBe(FORCED_OLD_SCHEMA_VERSION)
        expect(migratedState.embeddedType).toBe('freieFertigkeit')
        expect(migratedState.worldItemType).toBe('freieFertigkeit')
        expect(migratedState.embeddedStufeType).toBe('number')
        expect(migratedState.embeddedGruppeType).toBe('number')
        expect(migratedState.worldItemStufeType).toBe('number')
        expect(migratedState.worldItemGruppeType).toBe('number')
    })
})
