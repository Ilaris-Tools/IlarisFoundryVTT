/**
 * E2E-037 – Structured spell modifications
 *
 * Covers the migrated spell forms directly in the configured Foundry world.
 * The test deliberately uses the runtime resolver and pre-effect processor so
 * source data, ActiveEffect creation, summon cleanup, and the legacy fallback
 * are all exercised against real documents.
 */

import { expect, test } from '@playwright/test'
import {
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    openActorSheet,
    openSpellDialog,
} from '../../shared/fixtures/foundry'

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

    test('renders Dämonenbann forms and updates the selected suppression profile', async ({
        page,
    }) => {
        const createdItemId = await page.evaluate(async (packId) => {
            const actor = game.actors?.getName('HatAlles') as any
            const source = (await game.packs?.get(packId)?.getDocuments())?.find(
                (entry: any) => entry.name === 'Dämonenbann',
            ) as any
            if (!actor || !source) throw new Error('Dämonenbann oder HatAlles fehlt.')
            const itemData = source.toObject()
            itemData.name = 'E2E Dämonenbann'
            const [item] = await actor.createEmbeddedDocuments('Item', [itemData])
            return item.id
        }, SPELL_PACK)

        try {
            const actorWindow = await openActorSheet(page, ACTOR_NAME)
            await openSpellDialog(actorWindow, 'E2E Dämonenbann')
            const dialog = page
                .locator('.window-app, .application')
                .filter({ hasText: 'Dämonenbann' })
                .last()
            const section = dialog.locator('.spell-modifications-section')
            await expect(section).toBeVisible()
            await expect(
                section.getByRole('heading', { name: 'Zaubermodifikationen' }),
            ).toBeVisible()
            await expect(section.locator('.spell-modification')).toHaveCount(4)
            const suppressionOption = section.locator(
                'label.spell-modification-option:has(input[value="magie-unterdruecken"])',
            )
            await expect(suppressionOption).toBeVisible()
            await suppressionOption.click()
            await expect(
                section.locator('.spell-modification[value="magie-unterdruecken"]'),
            ).toBeChecked()
            await expect(section).toContainText(
                'Kosten 8, Ziel Zone, Reichweite 8 Schritt, Dauer 1 Stunde',
            )
            await dialog.screenshot({ path: 'test-results/daemonban-spell-modifications.png' })
        } finally {
            await page
                .evaluate(
                    async ({ actorName, itemId }) => {
                        if (!itemId) return
                        const actor = game.actors?.getName(actorName) as any
                        await actor?.deleteEmbeddedDocuments('Item', [itemId])
                    },
                    { actorName: ACTOR_NAME, itemId: createdItemId },
                )
                .catch(() => {})
        }
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

    test('Dämonenbann suppression applies to contained Dämonisch rolls and cleans up exactly', async ({
        page,
    }) => {
        const result = await page.evaluate(async (packId) => {
            const caster = game.actors?.getName('HatAlles') as any
            const target = game.actors?.getName('Testlauf-Held') as any
            const scene = canvas.scene as any
            const spell = (await game.packs?.get(packId)?.getDocuments())?.find(
                (entry: any) => entry.name === 'Dämonenbann',
            ) as any
            if (!caster || !target || !scene || !spell)
                throw new Error('Dämonenbann-E2E-Grundlage fehlt.')

            const { resolveSpellModificationContext } =
                await import('/systems/Ilaris/scripts/items/data/spell-modifications.js')
            const { createZoneRegionData } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-region-adapter.js')
            const { createPersistentZone } =
                await import('/systems/Ilaris/scripts/combat/zones/zone-lifecycle.js')
            const { resolveIlarisModifiers } =
                await import('/systems/Ilaris/scripts/effects/utils/ilaris-modifier-resolver.js')
            const context = resolveSpellModificationContext(spell, ['magie-unterdruecken'])
            if (!context.valid || !context.zone)
                throw new Error(context.errors.join(' ') || 'Magie unterdrücken ist ungültig.')

            const created = { tokenIds: [] as string[], actorId: '', regionIds: [] as string[] }
            const origin = {
                x: canvas.dimensions.sceneX + canvas.grid.size * 16,
                y: canvas.dimensions.sceneY + canvas.grid.size * 16,
            }
            const waitFor = async (predicate: () => boolean, message: string) => {
                const deadline = Date.now() + 15000
                while (!predicate()) {
                    if (Date.now() >= deadline) throw new Error(message)
                    await new Promise((resolve) => setTimeout(resolve, 50))
                }
            }
            const modifierValue = (actor: any, fertigkeit: string) =>
                resolveIlarisModifiers({
                    actor,
                    phase: 'roll',
                    target: 'probe',
                    fertigkeit,
                }).value

            try {
                const outsideSource = target.toObject()
                delete outsideSource._id
                outsideSource.name = 'E2E Dämonenbann außen'
                outsideSource.flags = { Ilaris: { e2eDaemonban: true } }
                const [outsideActor] = await Actor.createDocuments([outsideSource])
                created.actorId = outsideActor.id

                const [casterToken, targetToken, outsideToken] =
                    await scene.createEmbeddedDocuments('Token', [
                        {
                            name: 'E2E Dämonenbann Caster',
                            actorId: caster.id,
                            x: origin.x,
                            y: origin.y,
                            flags: { Ilaris: { e2eDaemonban: true } },
                        },
                        {
                            name: 'E2E Dämonenbann Ziel innen',
                            actorId: target.id,
                            x: origin.x + canvas.grid.size,
                            y: origin.y,
                            flags: { Ilaris: { e2eDaemonban: true } },
                        },
                        {
                            name: 'E2E Dämonenbann Ziel außen',
                            actorId: outsideActor.id,
                            x: origin.x + canvas.grid.size * 32,
                            y: origin.y,
                            flags: { Ilaris: { e2eDaemonban: true } },
                        },
                    ])
                created.tokenIds.push(casterToken.id, targetToken.id, outsideToken.id)
                await waitFor(
                    () =>
                        Boolean(canvas.tokens?.get(casterToken.id)) &&
                        Boolean(canvas.tokens?.get(targetToken.id)),
                    'Dämonenbann-Token sind nicht auf dem Canvas bereit.',
                )

                const create = async (maechtigeMagieQs: number) => {
                    const region = (await createPersistentZone({
                        scene,
                        regionData: createZoneRegionData(context.zone, origin, {
                            flags: { Ilaris: { e2eDaemonban: true } },
                        }),
                        dialog: {
                            item: spell,
                            actor: caster,
                            zoneCasterTokenId: casterToken.id,
                            armedInputValues: {},
                            maneuverDurationBonus: 0,
                            maechtigeMagieQs,
                            getSelectedSpellModificationId: () => 'magie-unterdruecken',
                        },
                        zone: context.zone,
                        preEffects: context.preEffects,
                    })) as any
                    if (!region) throw new Error('Dämonenbann-Region wurde nicht erzeugt.')
                    created.regionIds.push(region.id)
                    const owned = (actor: any) =>
                        Array.from(actor.effects ?? []).filter(
                            (effect: any) => effect.flags?.ilaris?.zoneRegionId === region.id,
                        ) as any[]
                    await waitFor(
                        () => owned(caster).length === 1 && owned(target).length === 1,
                        'Dämonenbann-Effekte wurden nicht für beide enthaltenen Akteure erzeugt.',
                    )
                    return { region, owned }
                }

                const base = await create(0)
                const baseEffect = base.owned(target)[0]
                const baseResult = {
                    zone: base.region.flags?.Ilaris?.zone?.profile,
                    effect: baseEffect?.system?.ilarisModifiers?.[0],
                    daemonisch: modifierValue(target, 'Dämonisch'),
                    otherSkill: modifierValue(target, 'Antimagie'),
                    caster: modifierValue(caster, 'Dämonisch'),
                    outsideOwnedEffects: Array.from(outsideActor.effects ?? []).filter(
                        (effect: any) => effect.flags?.ilaris?.zoneRegionId === base.region.id,
                    ).length,
                }
                await base.region.delete()
                await waitFor(
                    () => base.owned(caster).length === 0 && base.owned(target).length === 0,
                    'Dämonenbann-Effekte wurden beim Löschen der Region nicht entfernt.',
                )

                const amplified = await create(1)
                const amplifiedResult = {
                    daemonisch: modifierValue(target, 'Dämonisch'),
                    effectValue: amplified.owned(target)[0]?.system?.ilarisModifiers?.[0]?.value,
                }
                await amplified.region.delete()
                await waitFor(
                    () =>
                        amplified.owned(caster).length === 0 &&
                        amplified.owned(target).length === 0,
                    'Verstärkte Dämonenbann-Effekte wurden nicht entfernt.',
                )

                return { base: baseResult, amplified: amplifiedResult, cleanup: true }
            } finally {
                const regions = created.regionIds.filter((id) => scene.regions.get(id))
                if (regions.length) await scene.deleteEmbeddedDocuments('Region', regions)
                const tokens = created.tokenIds.filter((id) => scene.tokens.get(id))
                if (tokens.length) await scene.deleteEmbeddedDocuments('Token', tokens)
                if (created.actorId && game.actors?.get(created.actorId))
                    await Actor.deleteDocuments([created.actorId])
            }
        }, SPELL_PACK)

        expect(result.base.zone).toMatchObject({
            shape: 'circle',
            distance: 16,
            placement: { anchor: 'free', range: 8, pivot: 'center' },
            targeting: { includeCaster: true },
        })
        expect(result.base.effect).toMatchObject({
            phase: 'roll',
            target: 'probe',
            value: '-8',
            selector: { fertigkeit: 'Dämonisch' },
        })
        expect(result.base).toMatchObject({
            daemonisch: -8,
            otherSkill: 0,
            caster: -8,
            outsideOwnedEffects: 0,
        })
        expect(result.amplified).toEqual({ daemonisch: -12, effectValue: '-8-4' })
        expect(result.cleanup).toBe(true)
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
