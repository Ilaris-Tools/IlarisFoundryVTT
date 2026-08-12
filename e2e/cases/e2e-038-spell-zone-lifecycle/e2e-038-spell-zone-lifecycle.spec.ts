/** E2E-038 - Structured spell-zone resolution and persistent scene duration. */
import { expect, test } from '@playwright/test'
import { E2E_BASELINE } from '../../shared/baseline'
import { clearChatLog, foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

async function clearE2EZoneDocuments(page: import('@playwright/test').Page) {
    await page
        .evaluate(async () => {
            const scene = canvas.scene as any
            const regionIds = Array.from(scene?.regions ?? [])
                .filter((region: any) => {
                    const flags = region.flags?.Ilaris ?? {}
                    return Boolean(flags.e2eZone || flags.zone || flags.zoneDraft)
                })
                .map((region: any) => region.id)
            if (regionIds.length) await scene.deleteEmbeddedDocuments('Region', regionIds)
            const tokenIds = Array.from(scene?.tokens ?? [])
                .filter((token: any) => token.flags?.Ilaris?.e2eZone)
                .map((token: any) => token.id)
            if (tokenIds.length) await scene.deleteEmbeddedDocuments('Token', tokenIds)
        })
        .catch(() => {})
}

test.describe('E2E-038 · Spell zone lifecycle', () => {
    let templateDeprecations: string[] = []

    test.beforeEach(async ({ page }) => {
        templateDeprecations = []
        page.on('console', (message) => {
            const text = message.text()
            if (
                /MeasuredTemplate|Scene#templates|MEASURED_TEMPLATE_TYPES|core\.gridTemplates/.test(
                    text,
                )
            )
                templateDeprecations.push(text)
        })
        await loginAndJoinWorld(page, foundryConfig)
        // A failed or externally terminated earlier run may not reach afterEach.
        // The isolated E2E world must therefore start without stale Ilaris zones.
        await clearE2EZoneDocuments(page)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await clearE2EZoneDocuments(page)
        await clearChatLog(page).catch(() => {})
        expect(templateDeprecations).toEqual([])
    })

    test('resolves the cone, circular form, and non-zone Faxius form', async ({ page }) => {
        const result = await page.evaluate(async (packId) => {
            const pack = game.packs?.get(packId)
            const spell = (await pack?.getDocuments())?.find(
                (entry: any) => entry.name === 'Tlalucs Odem Pestgestank',
            )
            if (!spell) throw new Error('Tlalucs Odem Pestgestank fehlt.')
            const { resolveSpellModificationContext } =
                await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
            return {
                base: resolveSpellModificationContext(spell, []).zone,
                sphere: resolveSpellModificationContext(spell, ['miasmasphaero']).zone,
                faxius: resolveSpellModificationContext(spell, ['miasmafaxius']).zone,
            }
        }, SPELL_PACK)

        expect(result.base).toMatchObject({ shape: 'cone', distance: 8, angle: 45 })
        expect(result.sphere).toMatchObject({
            shape: 'circle',
            placement: { anchor: 'caster', pivot: 'center' },
        })
        expect(result.faxius).toBeNull()
    })

    test('resolves a placed Pestgestank cone against only its contained token', async ({
        page,
    }) => {
        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            const scene = canvas.scene as any
            const gridSize = canvas.grid.size
            if (!actor || !scene || !gridSize) throw new Error('Akteur, Szene oder Grid fehlt.')
            const origin = {
                x: canvas.dimensions.sceneX + gridSize * 6,
                y: canvas.dimensions.sceneY + gridSize * 6,
            }
            const [inside, outside] = await scene.createEmbeddedDocuments('Token', [
                {
                    name: 'E2E Zonen-Ziel innen',
                    actorId: actor.id,
                    x: origin.x + gridSize * 2 - gridSize / 2,
                    y: origin.y - gridSize / 2,
                    flags: { Ilaris: { e2eZone: true } },
                },
                {
                    name: 'E2E Zonen-Ziel außen',
                    actorId: actor.id,
                    x: origin.x - gridSize * 3 - gridSize / 2,
                    y: origin.y - gridSize / 2,
                    flags: { Ilaris: { e2eZone: true } },
                },
            ])
            const { createZoneRegionData } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
            const { resolveZoneTargets } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-targets.js')
            const [region] = await scene.createEmbeddedDocuments('Region', [
                createZoneRegionData(
                    {
                        shape: 'cone',
                        distance: 4,
                        angle: 45,
                        placement: { anchor: 'free', pivot: 'tip', range: 8 },
                        targeting: { includeCaster: true },
                    },
                    { ...origin, direction: 0 },
                    { flags: { Ilaris: { e2eZone: true } } },
                ),
            ])
            if (!region) throw new Error('Pestgestank-Region wurde nicht erzeugt.')
            await new Promise((resolve) => setTimeout(resolve, 250))
            return {
                insideId: inside.id,
                outsideId: outside.id,
                targetIds: resolveZoneTargets(region).map((target: any) => target.tokenId),
            }
        }, ACTOR_NAME)

        expect(result.targetIds).toContain(result.insideId)
        expect(result.targetIds).not.toContain(result.outsideId)
    })

    test('cancels a draft Region and creates only its replacement before a cast', async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const scene = canvas.scene as any
            const { createZoneDraftRegion, deleteZoneDraftRegion } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
            const { createZoneRegionData } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
            const profile = {
                shape: 'circle',
                distance: 2,
                placement: { anchor: 'free', pivot: 'center', range: 8 },
            }
            const regionData = createZoneRegionData(
                profile,
                {
                    x: canvas.dimensions.sceneX + canvas.grid.size * 4,
                    y: canvas.dimensions.sceneY + canvas.grid.size * 4,
                },
                { flags: { Ilaris: { e2eZone: true } } },
            )
            const ownerUserId = game.user.id
            const first = await createZoneDraftRegion({
                scene,
                regionData,
                draftId: foundry.utils.randomID(16),
                ownerUserId,
                dialogId: 'e2e-zone-dialog',
            })
            if (!first) throw new Error('Erste Zonenplatzierung wurde nicht erzeugt.')
            const cancelled = await deleteZoneDraftRegion({
                scene,
                draftId: first.id,
                ownerUserId,
                dialogId: 'e2e-zone-dialog',
            })
            const replacement = await createZoneDraftRegion({
                scene,
                regionData,
                draftId: foundry.utils.randomID(16),
                ownerUserId,
                dialogId: 'e2e-zone-dialog',
            })
            return {
                cancelled,
                firstStillExists: Boolean(scene.regions.get(first.id)),
                replacementId: replacement?.id,
                draftIds: Array.from(scene.regions ?? [])
                    .filter(
                        (region: any) =>
                            region.flags?.Ilaris?.zoneDraft?.dialogId === 'e2e-zone-dialog',
                    )
                    .map((region: any) => region.id),
            }
        })

        expect(result.cancelled).toBe(true)
        expect(result.firstStillExists).toBe(false)
        expect(result.draftIds).toEqual([result.replacementId])
    })

    test('keeps zone spells on the manual path when target automation is disabled', async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const previous = game.settings.get('Ilaris', 'useTargetSelection')
            try {
                await game.settings.set('Ilaris', 'useTargetSelection', false)
                const { UebernatuerlichDialog } =
                    await import('/systems/Ilaris/scripts/combat/dialogs/uebernatuerlich.js')
                const dialog = Object.create(UebernatuerlichDialog.prototype) as any
                dialog.getEffectiveSpellModificationContext = () => ({ zone: { shape: 'cone' } })
                dialog.zonePlacement = null
                return {
                    requiresPlacement: dialog._hasZonePlacementRequirement(),
                    placementMissing: dialog._isZonePlacementMissing(),
                }
            } finally {
                await game.settings.set('Ilaris', 'useTargetSelection', previous)
            }
        })

        expect(result).toEqual({ requiresPlacement: false, placementMissing: false })
    })

    test('sends one resistance prompt to the player-owned target on creation and re-entry', async ({
        page,
        browser,
    }) => {
        const playerContext = await browser.newContext()
        const playerPage = await playerContext.newPage()
        try {
            await loginAndJoinWorld(playerPage, {
                ...foundryConfig,
                username: E2E_BASELINE.users.player,
            })
            await expect
                .poll(() => playerPage.evaluate(() => game.user.name))
                .toBe(E2E_BASELINE.users.player)
            const result = await page.evaluate(
                async ({ casterName, targetName, packId }) => {
                    const caster = game.actors?.getName(casterName) as any
                    const target = game.actors?.getName(targetName) as any
                    const scene = canvas.scene as any
                    const pack = game.packs?.get(packId)
                    const spell = (await pack?.getDocuments())?.find(
                        (entry: any) => entry.name === 'Wand aus Dornen',
                    )
                    if (!caster || !target || !scene || !spell)
                        throw new Error('E2E-Zonenquellen fehlen.')
                    const { resolveSpellModificationContext } =
                        await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
                    const { createPersistentZone } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                    const { createZoneRegionData } =
                        await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                    const origin = {
                        x: canvas.dimensions.sceneX + canvas.grid.size * 12,
                        y: canvas.dimensions.sceneY + canvas.grid.size * 12,
                    }
                    const [targetToken] = await scene.createEmbeddedDocuments('Token', [
                        {
                            name: 'E2E Dornentarget',
                            actorId: target.id,
                            x: origin.x,
                            y: origin.y,
                            flags: { Ilaris: { e2eZone: true } },
                        },
                    ])
                    const context = resolveSpellModificationContext(spell, [])
                    const region = await createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(
                            context.zone,
                            { ...origin, direction: 0 },
                            { flags: { Ilaris: { e2eZone: true } } },
                        ),
                        dialog: {
                            item: spell,
                            actor: caster,
                            zoneCasterTokenId: '',
                            armedInputValues: {},
                            maneuverDurationBonus: 0,
                            maechtigeMagieQs: 0,
                            getSelectedSpellModificationId: () => '',
                        },
                        zone: context.zone,
                        preEffects: [
                            {
                                baseDuration: 1,
                                instant: false,
                                changes: [
                                    { key: 'system.attribute.KO.pw', type: 'add', value: '-1' },
                                ],
                                avoidTest: { enabled: true, attribut: 'KO', diminishedOnly: false },
                            },
                        ],
                    })
                    if (!region) throw new Error('Dornengrenze wurde nicht erzeugt.')
                    return { regionId: region.id, tokenId: targetToken.id, origin }
                },
                {
                    casterName: ACTOR_NAME,
                    targetName: E2E_BASELINE.ownership.actor,
                    packId: SPELL_PACK,
                },
            )

            const promptCountForTarget = (tokenId: string) =>
                playerPage.evaluate((targetTokenId) => {
                    return game.messages.contents.filter((message: any) => {
                        const serialized = message.content.match(
                            /data-pre-effect-data="([^"]+)"/,
                        )?.[1]
                        if (!serialized) return false
                        const data = JSON.parse(decodeURIComponent(serialized))
                        return data.target?.tokenId === targetTokenId
                    }).length
                }, tokenId)
            await expect.poll(() => promptCountForTarget(result.tokenId)).toBe(1)

            await page.evaluate(async ({ tokenId, origin }) => {
                const token = canvas.scene?.tokens.get(tokenId) as any
                if (!token) throw new Error('E2E Dornentarget fehlt.')
                await token.update({ x: origin.x + canvas.grid.size * 20 })
                await new Promise((resolve) => setTimeout(resolve, 250))
                await token.update({ x: origin.x })
            }, result)

            await expect.poll(() => promptCountForTarget(result.tokenId)).toBe(2)
        } finally {
            await playerContext.close()
        }
    })

    test('creates a GM-owned thorn-wall Region and decrements it once per round', async ({
        page,
    }) => {
        const created = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const pack = game.packs?.get(packId)
                const spell = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Wand aus Dornen',
                )
                if (!actor || !scene || !spell) throw new Error('Wand, Akteur oder Szene fehlt.')
                const { resolveSpellModificationContext } =
                    await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
                const { createPersistentZone, reducePersistentZoneDurations } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                const { createZoneRegionData, validateZonePlacement } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                const context = resolveSpellModificationContext(spell, [])
                const [casterDocument] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Wand-Caster',
                        actorId: actor.id,
                        x: canvas.dimensions.sceneX + canvas.grid.size * 8,
                        y: canvas.dimensions.sceneY + canvas.grid.size * 8,
                        flags: { Ilaris: { e2eZone: true } },
                    },
                ])
                await new Promise((resolve) => setTimeout(resolve, 250))
                const casterToken = canvas.tokens?.get(casterDocument.id)
                if (!casterToken) throw new Error('Wand-Caster-Token fehlt.')
                const placement = {
                    x: casterToken.center.x,
                    y: casterToken.center.y,
                    direction: 0,
                }
                if (!validateZonePlacement(context.zone, casterToken, placement))
                    throw new Error('Wand aus Dornen liegt außerhalb der Zauberreichweite.')
                const region = (await createPersistentZone({
                    scene,
                    regionData: createZoneRegionData(context.zone, placement, {
                        flags: { Ilaris: { e2eZone: true } },
                    }),
                    dialog: {
                        item: spell,
                        actor,
                        zoneCasterTokenId: casterDocument.id,
                        armedInputValues: {},
                        maneuverDurationBonus: 0,
                        maechtigeMagieQs: 0,
                        getSelectedSpellModificationId: () => '',
                    },
                    zone: context.zone,
                    preEffects: [],
                })) as any
                if (!region) throw new Error('Persistente Zone wurde nicht erzeugt.')
                await new Promise((resolve) => setTimeout(resolve, 250))
                await reducePersistentZoneDurations({ scene }, {})
                await new Promise((resolve) => setTimeout(resolve, 250))
                return {
                    id: region.id,
                    shape: region.shapes[0]?.type,
                    sceneRegionIds: Array.from(scene.regions ?? []).map((entry: any) => entry.id),
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )

        expect(created.id).toBeTruthy()
        expect(created.shape).toBe('rectangle')
        expect(created.sceneRegionIds).toContain(created.id)

        // Foundry receives its own embedded-document updates asynchronously.
        // Reloading verifies persistence rather than this client's stale cache.
        await page.reload()
        await loginAndJoinWorld(page, foundryConfig)
        const persisted = await page.evaluate((regionId) => {
            const region = canvas.scene?.regions.get(regionId) as any
            return {
                remaining: region?.flags?.Ilaris?.zone?.remaining,
                durationType: region?.flags?.Ilaris?.zone?.durationType,
            }
        }, created.id)

        expect(persisted.durationType).toBe('sceneRounds')
        expect(persisted.remaining).toBe(255)
    })

    test('applies, removes, reapplies, and isolates passive Zone effects', async ({ page }) => {
        const result = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const scene = canvas.scene as any
                const pack = game.packs?.get(packId)
                const spell = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Dunkelheit',
                ) as any
                if (!actor || !scene || !spell)
                    throw new Error('Akteur, Szene oder Dunkelheit fehlt.')
                const {
                    createPersistentZone,
                    reconcilePersistentPassiveZones,
                    reducePersistentZoneDurations,
                    updatePersistentZoneMembership,
                } = await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
                const { createZoneRegionData } =
                    await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
                const origin = {
                    x: canvas.dimensions.sceneX + canvas.grid.size * 16,
                    y: canvas.dimensions.sceneY + canvas.grid.size * 16,
                }
                const [targetToken] = await scene.createEmbeddedDocuments('Token', [
                    {
                        name: 'E2E Passivzonen-Ziel',
                        actorId: actor.id,
                        x: origin.x,
                        y: origin.y,
                        flags: { Ilaris: { e2eZone: true } },
                    },
                ])
                await new Promise((resolve) => setTimeout(resolve, 500))
                const targetActor = canvas.tokens?.get(targetToken.id)?.actor as any
                if (!targetActor)
                    throw new Error('E2E Passivzonen-Ziel ist nicht auf dem Canvas bereit.')

                const makeRegion = async (zone = spell.system.zone) =>
                    createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(zone, origin, {
                            flags: { Ilaris: { e2eZone: true } },
                        }),
                        dialog: {
                            item: spell,
                            actor,
                            zoneCasterTokenId: '',
                            armedInputValues: {},
                            maneuverDurationBonus: 0,
                            maechtigeMagieQs: 0,
                            getSelectedSpellModificationId: () => '',
                        },
                        zone,
                        preEffects: spell.system.preEffects,
                    })
                const first = (await makeRegion()) as any
                const second = (await makeRegion()) as any
                if (!first || !second)
                    throw new Error('Passive Dunkelheit-Zone wurde nicht erzeugt.')
                const ownedEffects = (regions = [first, second]) =>
                    Array.from(targetActor.effects ?? []).filter(
                        (effect: any) =>
                            effect.flags?.ilaris?.passiveZone &&
                            regions.some(
                                (region: any) => region.id === effect.flags?.ilaris?.zoneRegionId,
                            ),
                    )
                const initial = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                await reconcilePersistentPassiveZones(scene)
                await reconcilePersistentPassiveZones(scene)
                const afterReconciliation = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                const token = scene.tokens.get(targetToken.id) as any
                await token.update({ x: origin.x + canvas.grid.size * 10 })
                await new Promise((resolve) => setTimeout(resolve, 500))
                await updatePersistentZoneMembership(scene, token)
                const afterLeave = {
                    effectRegionIds: ownedEffects().map(
                        (effect: any) => effect.flags.ilaris.zoneRegionId,
                    ),
                    memberships: [first, second].map(
                        (region: any) => region.flags?.Ilaris?.zone?.membership ?? [],
                    ),
                }
                await token.update({ x: origin.x })
                await new Promise((resolve) => setTimeout(resolve, 500))
                await updatePersistentZoneMembership(scene, token)
                const afterReentry = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                await first.delete()
                // Foundry does not await asynchronous deleteRegion hook listeners.
                await new Promise((resolve) => setTimeout(resolve, 500))
                const afterFirstDeletion = ownedEffects().map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                const expiringZone = foundry.utils.deepClone(spell.system.zone)
                expiringZone.duration = { remaining: 1, originalValue: 1 }
                const expiring = (await makeRegion(expiringZone)) as any
                if (!expiring) throw new Error('Ablaufende passive Zone wurde nicht erzeugt.')
                await reducePersistentZoneDurations({ scene }, {})
                const afterExpiry = ownedEffects([first, second, expiring]).map(
                    (effect: any) => effect.flags.ilaris.zoneRegionId,
                )
                return {
                    initial,
                    afterReconciliation,
                    afterLeave,
                    afterReentry,
                    firstId: first.id,
                    secondId: second.id,
                    afterFirstDeletion,
                    afterExpiry,
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )

        expect(result.initial.sort()).toEqual([result.firstId, result.secondId].sort())
        expect(result.afterReconciliation.sort()).toEqual([result.firstId, result.secondId].sort())
        expect(result.afterLeave).toEqual({ effectRegionIds: [], memberships: [[], []] })
        expect(result.afterReentry.sort()).toEqual([result.firstId, result.secondId].sort())
        expect(result.afterFirstDeletion).toEqual([result.secondId])
        expect(result.afterExpiry).toEqual([result.secondId])
    })
})
