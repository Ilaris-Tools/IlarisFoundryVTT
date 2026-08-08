import { expect, test } from '@playwright/test'
import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    restoreFoundrySetting,
    setFoundrySettingForTest,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'

test.describe('E2E-034 · summoned items', () => {
    let createdItemIds: string[] = []
    let createdEffectIds: string[] = []
    let stackingSetting: import('../../shared/fixtures/foundry').FoundrySettingSnapshot | undefined

    test.beforeEach(async ({ page }) => {
        createdItemIds = []
        createdEffectIds = []
        stackingSetting = undefined
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, itemIds, effectIds }) => {
                    const actor = game.actors?.getName(actorName)
                    if (!actor) return
                    if (effectIds.length)
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
                    if (itemIds.length) await actor.deleteEmbeddedDocuments('Item', itemIds)
                },
                { actorName: ACTOR_NAME, itemIds: createdItemIds, effectIds: createdEffectIds },
            )
            .catch(() => {})
        await clearChatLog(page).catch(() => {})
        if (stackingSetting) await restoreFoundrySetting(page, stackingSetting).catch(() => {})
    })

    test('Segen der Heiligen Ardare summons Armalion into the selected target inventory', async ({
        page,
    }) => {
        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            const pack = game.packs?.get('Ilaris.liturgien-und-mirakel')
            const spellSource = (await pack?.getDocuments())?.find(
                (item: any) => item.name === 'Segen der Heiligen Ardare',
            )
            if (!actor || !spellSource) throw new Error('Ardare oder HatAlles fehlt.')

            const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
            const effectIdsBefore = new Set(actor.effects.map((effect: any) => effect.id))
            const [spell] = await actor.createEmbeddedDocuments('Item', [spellSource.toObject()])
            const processor =
                await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
            await processor.applyPreEffects(
                { success: true },
                {
                    item: spell,
                    actor,
                    speaker: {},
                    selectedActors: [{ actorId: actor.id }],
                    maneuverDurationBonus: 0,
                    maechtigeMagieQs: 0,
                },
            )

            const summoned = actor.items.find(
                (item: any) =>
                    item.flags?.ilaris?.summon &&
                    item.flags.ilaris.spellUuid === spell.uuid &&
                    item.name === 'Armalion',
            ) as any
            const marker = actor.effects.find(
                (effect: any) => effect.flags?.ilaris?.summonedItemId === summoned?.id,
            ) as any
            return {
                createdItemIds: actor.items
                    .filter((item: any) => !itemIdsBefore.has(item.id))
                    .map((item: any) => item.id),
                createdEffectIds: actor.effects
                    .filter((effect: any) => !effectIdsBefore.has(effect.id))
                    .map((effect: any) => effect.id),
                summoned: {
                    exists: !!summoned,
                    hauptwaffe: summoned?.system?.hauptwaffe,
                    type: summoned?.type,
                    duration: marker?.system?.ilarisTiming?.remaining,
                    applicationMatches:
                        summoned?.flags?.ilaris?.applicationId ===
                        marker?.flags?.ilaris?.applicationId,
                },
            }
        }, ACTOR_NAME)
        createdItemIds.push(...result.createdItemIds)
        createdEffectIds.push(...result.createdEffectIds)

        expect(result.summoned).toEqual({
            exists: true,
            hauptwaffe: true,
            type: 'nahkampfwaffe',
            duration: 17,
            applicationMatches: true,
        })
    })

    test('Phexens Wurfstern ignores another weapon and vanishes after its own missed throw', async ({
        page,
    }) => {
        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            const pack = game.packs?.get('Ilaris.liturgien-und-mirakel')
            const spellSources = await pack?.getDocuments()
            const spellSource = spellSources?.find(
                (item: any) => item.name === 'Phexens Sternenwurf',
            )
            const ardareSource = spellSources?.find(
                (item: any) => item.name === 'Segen der Heiligen Ardare',
            )
            if (!actor || !spellSource || !ardareSource)
                throw new Error('Phexens Sternenwurf, Ardare oder HatAlles fehlt.')

            const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
            const effectIdsBefore = new Set(actor.effects.map((effect: any) => effect.id))
            const [spell] = await actor.createEmbeddedDocuments('Item', [spellSource.toObject()])
            const processor =
                await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
            const armed =
                await import('/systems/Ilaris/scripts/effects/pre-effects/armed-combat-effects.js')
            await processor.applyPreEffects(
                { success: true },
                {
                    item: spell,
                    actor,
                    speaker: {},
                    selectedActors: [{ actorId: actor.id }],
                    maneuverDurationBonus: 0,
                    maechtigeMagieQs: 2,
                },
            )

            const [ardare] = await actor.createEmbeddedDocuments('Item', [ardareSource.toObject()])
            await processor.applyPreEffects(
                { success: true },
                {
                    item: ardare,
                    actor,
                    speaker: {},
                    selectedActors: [{ actorId: actor.id }],
                    maneuverDurationBonus: 0,
                    maechtigeMagieQs: 0,
                },
            )

            const summoned = actor.items.find(
                (item: any) =>
                    item.flags?.ilaris?.summon &&
                    item.flags.ilaris.spellUuid === spell.uuid &&
                    item.name === 'Phexens Wurfstern',
            ) as any
            const marker = actor.effects.find(
                (effect: any) => effect.flags?.ilaris?.summonedItemId === summoned?.id,
            ) as any
            const companion = actor.items.find(
                (item: any) =>
                    item.flags?.ilaris?.summon &&
                    item.flags.ilaris.spellUuid === ardare.uuid &&
                    item.name === 'Armalion',
            ) as any
            const companionMarker = actor.effects.find(
                (effect: any) => effect.flags?.ilaris?.summonedItemId === companion?.id,
            ) as any
            const otherWeapon = actor.items.find(
                (item: any) => item.type === 'fernkampfwaffe' && item.id !== summoned?.id,
            ) as any
            const wrongContext = armed.getArmedAttackContext(actor, 'ranged', otherWeapon?.id)
            const ownContext = armed.getArmedAttackContext(actor, 'ranged', summoned?.id)
            await armed.resolveArmedAttack(actor, ownContext, { confirmedHit: false })

            return {
                createdItemIds: actor.items
                    .filter((item: any) => !itemIdsBefore.has(item.id))
                    .map((item: any) => item.id),
                createdEffectIds: actor.effects
                    .filter((effect: any) => !effectIdsBefore.has(effect.id))
                    .map((effect: any) => effect.id),
                wrongContextEffects: wrongContext.effects.length,
                ownContextEffects: ownContext.effects.length,
                tp: summoned?.system?.tp,
                itemRemoved: !actor.items.get(summoned?.id),
                markerRemoved: !actor.effects.get(marker?.id),
                companionRetained: !!actor.items.get(companion?.id),
                companionMarkerRetained: !!actor.effects.get(companionMarker?.id),
            }
        }, ACTOR_NAME)
        createdItemIds.push(...result.createdItemIds)
        createdEffectIds.push(...result.createdEffectIds)

        expect(result.wrongContextEffects).toBe(0)
        expect(result.ownContextEffects).toBe(1)
        expect(result.tp).toBe('2W20+1W20+1W20')
        expect(result.itemRemoved).toBe(true)
        expect(result.markerRemoved).toBe(true)
        expect(result.companionRetained).toBe(true)
        expect(result.companionMarkerRetained).toBe(true)
    })

    for (const stackingMode of ['ilaris', 'foundry']) {
        test(`owner-turn expiry removes only its linked recast in ${stackingMode} stacking mode`, async ({
            page,
        }) => {
            stackingSetting = await setFoundrySettingForTest(
                page,
                'Ilaris',
                'supernaturalEffectStacking',
                stackingMode,
            )
            const result = await page.evaluate(async (actorName) => {
                const actor = game.actors?.getName(actorName) as any
                const pack = game.packs?.get('Ilaris.liturgien-und-mirakel')
                const spellSource = (await pack?.getDocuments())?.find(
                    (item: any) => item.name === 'Phexens Sternenwurf',
                )
                if (!actor || !spellSource)
                    throw new Error('Phexens Sternenwurf oder HatAlles fehlt.')

                const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
                const effectIdsBefore = new Set(actor.effects.map((effect: any) => effect.id))
                const [spell] = await actor.createEmbeddedDocuments('Item', [
                    spellSource.toObject(),
                ])
                const processor =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                const dialog = {
                    item: spell,
                    actor,
                    speaker: {},
                    selectedActors: [{ actorId: actor.id }],
                    maneuverDurationBonus: 0,
                    maechtigeMagieQs: 0,
                }
                await processor.applyPreEffects({ success: true }, dialog)
                await processor.applyPreEffects({ success: true }, dialog)

                const summons = actor.items.filter(
                    (item: any) =>
                        item.flags?.ilaris?.summon &&
                        item.flags.ilaris.spellUuid === spell.uuid &&
                        item.name === 'Phexens Wurfstern',
                ) as any[]
                const markers = summons.map((item) =>
                    actor.effects.find(
                        (effect: any) => effect.flags?.ilaris?.summonedItemId === item.id,
                    ),
                ) as any[]
                if (summons.length !== 2 || markers.some((marker) => !marker)) {
                    throw new Error('Beschworene Kopien oder ihre Marker fehlen.')
                }
                await markers[0].update({
                    'system.ilarisTiming.remaining': 1,
                    'system.ilarisTiming.expiresOn': 'turnStart',
                })
                // Exercise the same reducer used by the combatTurn hook. Starting
                // a combat refreshes unrelated legacy effects in the test world.
                const { reduceEffectDurationForCombatant } =
                    await import('/systems/Ilaris/scripts/effects/combat-turn-hooks.js')
                await reduceEffectDurationForCombatant({ actor })

                return {
                    createdItemIds: actor.items
                        .filter((item: any) => !itemIdsBefore.has(item.id))
                        .map((item: any) => item.id),
                    createdEffectIds: actor.effects
                        .filter((effect: any) => !effectIdsBefore.has(effect.id))
                        .map((effect: any) => effect.id),
                    expiredItemId: summons[0].id,
                    retainedItemId: summons[1].id,
                    expiredMarkerId: markers[0].id,
                    retainedMarkerId: markers[1].id,
                }
            }, ACTOR_NAME)
            createdItemIds.push(...result.createdItemIds)
            createdEffectIds.push(...result.createdEffectIds)

            await page.waitForFunction(
                ({
                    actorName,
                    expiredItemId,
                    retainedItemId,
                    expiredMarkerId,
                    retainedMarkerId,
                }) => {
                    const actor = game.actors?.getName(actorName)
                    return (
                        !actor?.items.get(expiredItemId) &&
                        !!actor?.items.get(retainedItemId) &&
                        !actor?.effects.get(expiredMarkerId) &&
                        !!actor?.effects.get(retainedMarkerId)
                    )
                },
                { actorName: ACTOR_NAME, ...result },
                { timeout: 15000 },
            )
        })
    }
})
