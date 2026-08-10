/**
 * E2E-037 – Structured spell modifications
 *
 * Covers the migrated spell forms directly in the configured Foundry world.
 * The test deliberately uses the runtime resolver and pre-effect processor so
 * source data, ActiveEffect creation, summon cleanup, and the legacy fallback
 * are all exercised against real documents.
 */

import { expect, test } from '@playwright/test'
import { clearChatLog, foundryConfig, loginAndJoinWorld } from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SPELL_PACK = 'Ilaris.zauberspruche-und-rituale'

test.describe('E2E-037 · Structured spell modifications', () => {
    let createdItemIds: string[] = []
    let createdEffectIds: string[] = []

    test.beforeEach(async ({ page }) => {
        createdItemIds = []
        createdEffectIds = []
        await loginAndJoinWorld(page, foundryConfig)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, itemIds, effectIds }) => {
                    const actor = game.actors?.getName(actorName) as any
                    if (!actor) return
                    if (effectIds.length)
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
                    if (itemIds.length) await actor.deleteEmbeddedDocuments('Item', itemIds)
                },
                { actorName: ACTOR_NAME, itemIds: createdItemIds, effectIds: createdEffectIds },
            )
            .catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Attributo FF creates only its roll-scoped +2/+1 form modifiers', async ({ page }) => {
        const result = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const pack = game.packs?.get(packId)
                const source = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Attributo',
                )
                if (!actor || !source) throw new Error('Attributo oder HatAlles fehlt.')

                const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
                const effectIdsBefore = new Set(actor.effects.map((effect: any) => effect.id))
                const [spell] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                const { resolveSpellModificationContext } =
                    await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
                const { applyPreEffects } =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                const context = resolveSpellModificationContext(spell, ['ff'])
                if (!context.valid) throw new Error(context.errors.join(' '))
                await applyPreEffects(
                    { success: true },
                    {
                        item: spell,
                        actor,
                        speaker: {},
                        selectedActors: [{ actorId: actor.id }],
                        maneuverDurationBonus: 0,
                        maechtigeMagieQs: 0,
                    },
                    {},
                    { preEffects: context.preEffects, spellModificationId: 'ff' },
                )
                const effect = actor.effects.find(
                    (entry: any) =>
                        !effectIdsBefore.has(entry.id) &&
                        entry.flags?.ilaris?.spellModificationId === 'ff',
                ) as any
                return {
                    createdItemIds: actor.items
                        .filter((item: any) => !itemIdsBefore.has(item.id))
                        .map((item: any) => item.id),
                    createdEffectIds: actor.effects
                        .filter((entry: any) => !effectIdsBefore.has(entry.id))
                        .map((entry: any) => entry.id),
                    effect: {
                        changes: Array.from(effect?.changes ?? []),
                        modifiers: Array.from(effect?.system?.ilarisModifiers ?? []),
                    },
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )
        createdItemIds.push(...result.createdItemIds)
        createdEffectIds.push(...result.createdEffectIds)

        expect(result.effect.changes).toEqual([])
        expect(result.effect.modifiers).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ phase: 'roll', target: 'ff', value: '+2' }),
                expect.objectContaining({
                    phase: 'roll',
                    target: 'probe',
                    value: '+1',
                    selector: expect.objectContaining({ attribute: ['FF'] }),
                }),
            ]),
        )
    })

    test('Miasmafaxius inherits Pestgestank effects while changing the cast profile', async ({
        page,
    }) => {
        const result = await page.evaluate(async (packId) => {
            const pack = game.packs?.get(packId)
            const spell = (await pack?.getDocuments())?.find(
                (entry: any) => entry.name === 'Tlalucs Odem Pestgestank',
            )
            if (!spell) throw new Error('Tlalucs Odem Pestgestank fehlt.')
            const { resolveSpellModificationContext } =
                await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
            const context = resolveSpellModificationContext(spell, ['miasmafaxius'])
            return {
                valid: context.valid,
                profile: context.profile,
                basePreEffects: Object.values(spell.system.preEffects ?? {}).length,
                effectivePreEffects: context.preEffects.length,
                includesInstantDamage: context.preEffects.some((effect: any) => effect.instant),
            }
        }, SPELL_PACK)

        expect(result).toMatchObject({
            valid: true,
            profile: { difficulty: 8, cost: 8, target: 'Einzelperson' },
            includesInstantDamage: true,
        })
        expect(result.effectivePreEffects).toBe(result.basePreEffects)
    })

    test('Schimmernder Schild replaces Fortifex and summons a form-provenanced shield', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const pack = game.packs?.get(packId)
                const source = (await pack?.getDocuments())?.find(
                    (entry: any) => entry.name === 'Fortifex arkane Wand',
                )
                if (!actor || !source) throw new Error('Fortifex oder HatAlles fehlt.')

                const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
                const effectIdsBefore = new Set(actor.effects.map((effect: any) => effect.id))
                const [spell] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                const { resolveSpellModificationContext } =
                    await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
                const { applyPreEffects } =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                const context = resolveSpellModificationContext(spell, ['schimmernder-schild'])
                if (!context.valid) throw new Error(context.errors.join(' '))
                await applyPreEffects(
                    { success: true },
                    {
                        item: spell,
                        actor,
                        speaker: {},
                        selectedActors: [{ actorId: actor.id }],
                        maneuverDurationBonus: 0,
                        maechtigeMagieQs: 0,
                    },
                    {},
                    { preEffects: context.preEffects, spellModificationId: 'schimmernder-schild' },
                )
                const shield = actor.items.find(
                    (item: any) =>
                        !itemIdsBefore.has(item.id) &&
                        item.flags?.ilaris?.summon &&
                        item.flags?.ilaris?.spellUuid === spell.uuid,
                ) as any
                const marker = actor.effects.find(
                    (effect: any) =>
                        !effectIdsBefore.has(effect.id) &&
                        effect.flags?.ilaris?.summonedItemId === shield?.id,
                ) as any
                return {
                    createdItemIds: actor.items
                        .filter((item: any) => !itemIdsBefore.has(item.id))
                        .map((item: any) => item.id),
                    createdEffectIds: actor.effects
                        .filter((effect: any) => !effectIdsBefore.has(effect.id))
                        .map((effect: any) => effect.id),
                    shield: !!shield,
                    markerForm: marker?.flags?.ilaris?.spellModificationId,
                    duration: marker?.system?.ilarisTiming?.remaining,
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )
        createdItemIds.push(...result.createdItemIds)
        createdEffectIds.push(...result.createdEffectIds)

        expect(result).toEqual(
            expect.objectContaining({
                shield: true,
                markerForm: 'schimmernder-schild',
                duration: 65,
            }),
        )
    })

    test('generic anti-magic requires exactly one form and presents player/GM-managed outcomes', async ({
        page,
    }) => {
        const result = await page.evaluate(async (packId) => {
            const pack = game.packs?.get(packId)
            const spell = (await pack?.getDocuments())?.find(
                (entry: any) => entry.name === 'Dämonenbann',
            )
            if (!spell) throw new Error('Dämonenbann fehlt.')
            const { resolveSpellModificationContext } =
                await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
            const missing = resolveSpellModificationContext(spell, [])
            const selected = resolveSpellModificationContext(spell, ['zauber-aufheben'])
            return {
                missingValid: missing.valid,
                missingError: missing.errors[0],
                selectedValid: selected.valid,
                permanentCost: selected.profile.permanentCost,
                description: selected.selectedForms[0]?.description,
            }
        }, SPELL_PACK)

        expect(result.missingValid).toBe(false)
        expect(result.missingError).toContain('genau eine')
        expect(result).toMatchObject({
            selectedValid: true,
            permanentCost: 'Halbe Basiskosten des Zielzaubers',
        })
        expect(result.description).toContain('Spielleitung und Spieler')
    })

    test('legacy text-only modifications still generate their maneuver fallback', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName, packId }) => {
                const actor = game.actors?.getName(actorName) as any
                const pack = game.packs?.get(packId)
                const candidates = (await pack?.getDocuments())?.filter(
                    (spell: any) =>
                        spell.system?.modifikationen &&
                        !spell.system?.spellModificationPreset &&
                        Object.values(spell.system?.spellModifications ?? {}).length === 0,
                ) as any[]
                const source = candidates?.[0]
                if (!actor || !source)
                    throw new Error('Kein Zauber mit reiner Textmodifikation gefunden.')
                const itemIdsBefore = new Set(actor.items.map((item: any) => item.id))
                const [spell] = await actor.createEmbeddedDocuments('Item', [source.toObject()])
                await spell.setManoevers()
                return {
                    createdItemIds: actor.items
                        .filter((item: any) => !itemIdsBefore.has(item.id))
                        .map((item: any) => item.id),
                    name: spell.name,
                    maneuverCount: spell.manoever?.length ?? 0,
                }
            },
            { actorName: ACTOR_NAME, packId: SPELL_PACK },
        )
        createdItemIds.push(...result.createdItemIds)

        expect(result.name).toBeTruthy()
        expect(result.maneuverCount).toBeGreaterThan(0)
    })
})
