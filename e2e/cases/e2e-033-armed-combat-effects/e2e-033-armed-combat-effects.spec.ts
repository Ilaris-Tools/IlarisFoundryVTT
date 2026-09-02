import { expect, test } from '@playwright/test'
import { clearChatLog, foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'

test.describe('E2E-033 · armed combat effects', () => {
    let createdEffectIds: string[] = []
    let createdItemIds: string[] = []

    test.beforeEach(async ({ page }) => {
        createdEffectIds = []
        createdItemIds = []
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, effectIds, itemIds }) => {
                    const actor = game.actors?.getName(actorName)
                    if (actor && effectIds.length) {
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
                    }
                    if (actor && itemIds.length)
                        await actor.deleteEmbeddedDocuments('Item', itemIds)
                },
                { actorName: ACTOR_NAME, effectIds: createdEffectIds, itemIds: createdItemIds },
            )
            .catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Neun Streiche stores a bounded count, consumes on a hit, and keeps snapshot damage', async ({
        page,
    }) => {
        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            if (!actor) throw new Error('HatAlles wurde nicht gefunden.')
            let spell = actor.items.find((item: any) => item.name === 'Neun Streiche in einem')
            let createdItemId = ''
            if (!spell) {
                const source = (
                    await game.packs?.get('Ilaris.liturgien-und-mirakel')?.getDocuments()
                )?.find((item: any) => item.name === 'Neun Streiche in einem')
                if (!source) throw new Error('Neun Streiche in einem fehlt im Kompendium.')
                ;[spell] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                createdItemId = spell.id
            }

            const processor =
                await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
            const armed =
                await import('/systems/Ilaris/scripts/effects/pre-effects/armed-combat-effects.js')
            const preEffect = spell.system.preEffects[0]
            await processor.createActiveEffectFromPreEffect(
                actor,
                preEffect,
                actor,
                spell,
                2,
                0,
                0,
                foundry.utils.randomID(),
                { previousHits: 99 },
            )

            const effect = Array.from(actor.effects).find(
                (entry: any) => entry.name === spell.name && entry.system.ilarisArmedCombat,
            ) as any
            const context = armed.getArmedAttackContext(actor, 'melee')
            const damage = await armed.resolveArmedAttack(actor, context, { confirmedHit: true })
            return {
                effectId: effect?.id,
                storedHits: effect?.system.ilarisArmedCombat?.inputs?.previousHits,
                damage,
                removed: !actor.effects.get(effect?.id),
                createdItemId,
            }
        }, ACTOR_NAME)
        createdEffectIds.push(result.effectId)
        if (result.createdItemId) createdItemIds.push(result.createdItemId)

        expect(result.storedHits).toBe(8)
        expect(result.damage).toBe('8W6')
        expect(result.removed).toBe(true)
    })

    test('Falkenauge affects only a ranged attack and a miss still consumes its charge', async ({
        page,
    }) => {
        const result = await page.evaluate(async (actorName) => {
            const actor = game.actors?.getName(actorName) as any
            if (!actor) throw new Error('HatAlles wurde nicht gefunden.')
            let spell = actor.items.find((item: any) => item.name === 'Falkenauge Meisterschuss')
            let createdItemId = ''
            if (!spell) {
                const source = (
                    await game.packs?.get('Ilaris.zauberspruche-und-rituale')?.getDocuments()
                )?.find((item: any) => item.name === 'Falkenauge Meisterschuss')
                if (!source) throw new Error('Falkenauge Meisterschuss fehlt im Kompendium.')
                ;[spell] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                createdItemId = spell.id
            }

            const processor =
                await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
            const armed =
                await import('/systems/Ilaris/scripts/effects/pre-effects/armed-combat-effects.js')
            await processor.createActiveEffectFromPreEffect(
                actor,
                spell.system.preEffects[0],
                actor,
                spell,
                8,
            )
            const effect = Array.from(actor.effects).find(
                (entry: any) => entry.name === spell.name && entry.system.ilarisArmedCombat,
            ) as any
            const melee = armed.getArmedAttackContext(actor, 'melee')
            const ranged = armed.getArmedAttackContext(actor, 'ranged')
            await armed.resolveArmedAttack(actor, ranged, { confirmedHit: false })
            return {
                effectId: effect?.id,
                meleeCount: melee.effects.length,
                rangedBonus: armed.getArmedAttackBonus(ranged),
                removed: !actor.effects.get(effect?.id),
                createdItemId,
            }
        }, ACTOR_NAME)
        createdEffectIds.push(result.effectId)
        if (result.createdItemId) createdItemIds.push(result.createdItemId)

        expect(result.meleeCount).toBe(0)
        expect(result.rangedBonus).toBe(4)
        expect(result.removed).toBe(true)
    })
})
