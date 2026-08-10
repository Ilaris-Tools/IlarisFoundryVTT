import { expect, test } from '@playwright/test'
import {
    captureActorDefaultSnapshot,
    clearChatLog,
    foundryConfig,
    loginAndJoinWorld,
    restoreActorFromDefaultSnapshot,
} from '../../shared/fixtures/foundry'

const ACTOR_NAME = 'HatAlles'
const SOURCE_ACTOR_NAME = 'Testlauf-Npc'

test.describe('E2E-035 · maneuver pre-effects', () => {
    let actorSnapshot: import('../../shared/fixtures/foundry').ActorDefaultSnapshot
    let createdEffectIds: string[] = []

    test.beforeEach(async ({ page }) => {
        createdEffectIds = []
        await loginAndJoinWorld(page, foundryConfig)
        actorSnapshot = await captureActorDefaultSnapshot(page, ACTOR_NAME)
        await clearChatLog(page)
    })

    test.afterEach(async ({ page }) => {
        await page
            .evaluate(
                async ({ actorName, effectIds }) => {
                    const actor = game.actors?.getName(actorName)
                    if (actor && effectIds.length)
                        await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds)
                },
                { actorName: ACTOR_NAME, effectIds: createdEffectIds },
            )
            .catch(() => {})
        await restoreActorFromDefaultSnapshot(page, actorSnapshot).catch(() => {})
        await clearChatLog(page).catch(() => {})
    })

    test('Binden penalizes the attacker and expires at the end of that actor’s phase', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName, sourceActorName }) => {
                const actor = game.actors?.getName(actorName) as any
                const sourceActor = game.actors?.getName(sourceActorName) as any
                const maneuver = (await game.packs?.get('Ilaris.manover')?.getDocuments())?.find(
                    (item: any) => item.name === 'Binden',
                ) as any
                if (!actor || !sourceActor || !maneuver) throw new Error('Binden-Testdaten fehlen.')

                const processor =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                await processor.createActiveEffectFromPreEffect(
                    actor,
                    maneuver.system.preEffects[0],
                    sourceActor,
                    maneuver,
                    1,
                    0,
                    0,
                    foundry.utils.randomID(),
                    { inputValue: 2 },
                    'maneuver',
                )
                const effect = actor.effects.find(
                    (entry: any) =>
                        entry.name === 'Binden' && entry.flags?.ilaris?.sourceType === 'maneuver',
                ) as any
                if (!effect) throw new Error('Binden-Effekt wurde nicht erstellt.')

                const { reduceEffectDurationForCombatant } =
                    await import('/systems/Ilaris/scripts/effects/combat-turn-hooks.js')
                await reduceEffectDurationForCombatant({ actor })
                await Hooks.callAll('updateCombat', { combatants: [{ actor }] }, { turn: 0 })

                return {
                    effectId: effect.id,
                    penalty: effect.system.ilarisModifiers?.[0]?.value,
                    durationType: effect.system.ilarisTiming?.durationType,
                    expiresOn: effect.system.ilarisTiming?.expiresOn,
                }
            },
            { actorName: ACTOR_NAME, sourceActorName: SOURCE_ACTOR_NAME },
        )
        createdEffectIds.push(result.effectId)

        expect(result).toMatchObject({
            penalty: '-2',
            durationType: 'ownerTurns',
            expiresOn: 'turnEnd',
        })
        await page.waitForFunction(
            ({ actorName, effectId }) => !game.actors?.getName(actorName)?.effects.get(effectId),
            { actorName: ACTOR_NAME, effectId: result.effectId },
        )
    })

    test('Niederwerfen and Umreißen materialize Liegend after their resistance gate fails', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName, sourceActorName }) => {
                const actor = game.actors?.getName(actorName) as any
                const sourceActor = game.actors?.getName(sourceActorName) as any
                const maneuvers = await game.packs?.get('Ilaris.manover')?.getDocuments()
                const niederwerfen = maneuvers?.find(
                    (item: any) => item.name === 'Niederwerfen',
                ) as any
                const umreissen = maneuvers?.find((item: any) => item.name === 'Umreißen') as any
                if (!actor || !sourceActor || !niederwerfen || !umreissen)
                    throw new Error('Niederwerfen- oder Umreißen-Testdaten fehlen.')

                const processor =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                const before = new Set(actor.effects.map((entry: any) => entry.id))
                // The shared resistance suite covers successful and failed roll-dialog
                // resolution. This maneuver case verifies the persisted effect emitted
                // after that shared handler receives a failed resistance result.
                await processor.createActiveEffectFromPreEffect(
                    actor,
                    niederwerfen.system.preEffects[0],
                    sourceActor,
                    niederwerfen,
                    0,
                    0,
                    0,
                    foundry.utils.randomID(),
                    {},
                    'maneuver',
                )
                await processor.createActiveEffectFromPreEffect(
                    actor,
                    umreissen.system.preEffects[0],
                    sourceActor,
                    umreissen,
                    0,
                    0,
                    0,
                    foundry.utils.randomID(),
                    {},
                    'maneuver',
                )
                const created = actor.effects.filter((entry: any) => !before.has(entry.id)) as any[]
                const condition = actor.effects.find((entry: any) =>
                    entry.statuses?.has('Position4'),
                ) as any
                return {
                    effectIds: created.map((entry) => entry.id),
                    createdNames: created.map((entry) => entry.name).sort(),
                    statusIds: Array.from(condition?.statuses ?? []),
                    changes: condition?.changes.map((change: any) => change.value),
                    sourceTypes: condition?.system.ilarisCondition.sources.map(
                        (source: any) => source.type,
                    ),
                    niederwerfenResistance: niederwerfen.system.preEffects[0].avoidTest.attribut,
                    umreissenChoices: umreissen.system.preEffects[0].avoidTest.attributChoices,
                }
            },
            { actorName: ACTOR_NAME, sourceActorName: SOURCE_ACTOR_NAME },
        )
        createdEffectIds.push(...result.effectIds)

        expect(result).toMatchObject({
            createdNames: ['Sehr schlechte Position (Liegend)'],
            statusIds: ['Position4'],
            changes: [-4, -4],
            sourceTypes: ['preEffect', 'preEffect'],
            niederwerfenResistance: 'KK',
            umreissenChoices: ['GE', 'KO'],
        })
    })

    test('manual and automated Liegend sources protect one another in the status picker', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName }) => {
                const actor = game.actors?.getName(actorName) as any
                if (!actor) throw new Error('Liegend-Testactor fehlt.')

                const conditions =
                    await import('/systems/Ilaris/scripts/effects/status-conditions.js')
                const warnings: string[] = []
                const originalWarn = ui.notifications.warn
                ui.notifications.warn = ((message: string) =>
                    warnings.push(message)) as typeof ui.notifications.warn
                try {
                    await conditions.addConditionSource(actor, 'Position4', {
                        id: 'automated-prone',
                        type: 'preEffect',
                    })
                    await actor.toggleStatusEffect('Position4', { active: false })

                    const automatedOnly = actor.effects.find((effect: any) =>
                        effect.statuses?.has('Position4'),
                    ) as any
                    await actor.toggleStatusEffect('Position4', { active: true })
                    await actor.toggleStatusEffect('Position4', { active: false })

                    const afterManualRemoval = actor.effects.find((effect: any) =>
                        effect.statuses?.has('Position4'),
                    ) as any
                    await conditions.removeConditionSource(
                        actor,
                        afterManualRemoval,
                        'automated-prone',
                    )

                    return {
                        warning: warnings[0],
                        automatedOnlySources: automatedOnly?.system.ilarisCondition.sources.map(
                            (source: any) => source.type,
                        ),
                        sourcesAfterManualRemoval:
                            afterManualRemoval?.system.ilarisCondition.sources.map(
                                (source: any) => source.type,
                            ),
                        removedAfterFinalSource: !actor.effects.find((effect: any) =>
                            effect.statuses?.has('Position4'),
                        ),
                    }
                } finally {
                    ui.notifications.warn = originalWarn
                }
            },
            { actorName: ACTOR_NAME },
        )

        expect(result).toEqual({
            warning: 'Liegend bleibt durch einen automatischen Effekt aktiv.',
            automatedOnlySources: ['preEffect'],
            sourcesAfterManualRemoval: ['preEffect'],
            removedAfterFinalSource: true,
        })
    })

    test('Entwaffnen clears only the selected weapon slot after a failed KK resistance', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName, sourceActorName }) => {
                const actor = game.actors?.getName(actorName) as any
                const sourceActor = game.actors?.getName(sourceActorName) as any
                const maneuver = (await game.packs?.get('Ilaris.manover')?.getDocuments())?.find(
                    (item: any) => item.name === 'Entwaffnen',
                ) as any
                const weapon = actor?.items.find(
                    (item: any) => item.type === 'nahkampfwaffe',
                ) as any
                if (!actor || !sourceActor || !maneuver || !weapon)
                    throw new Error('Entwaffnen-Testdaten fehlen.')

                await weapon.update({ 'system.hauptwaffe': true, 'system.nebenwaffe': true })
                const processor =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                await processor.createActiveEffectFromPreEffect(
                    actor,
                    maneuver.system.preEffects[0],
                    sourceActor,
                    maneuver,
                    0,
                    0,
                    0,
                    foundry.utils.randomID(),
                    { selector: 'Hauptwaffe' },
                    'maneuver',
                )
                return {
                    choices: maneuver.system.input.choices,
                    resistance: maneuver.system.preEffects[0].avoidTest.attribut,
                    hauptwaffe: weapon.system.hauptwaffe,
                    nebenwaffe: weapon.system.nebenwaffe,
                }
            },
            { actorName: ACTOR_NAME, sourceActorName: SOURCE_ACTOR_NAME },
        )

        expect(result).toEqual({
            choices: ['Hauptwaffe', 'Nebenwaffe'],
            resistance: 'KK',
            hauptwaffe: false,
            nebenwaffe: true,
        })
    })

    test('Umklammern retains or deletes exactly its linked effect after the opposed escape', async ({
        page,
    }) => {
        const result = await page.evaluate(
            async ({ actorName, sourceActorName }) => {
                const actor = game.actors?.getName(actorName) as any
                const sourceActor = game.actors?.getName(sourceActorName) as any
                const maneuver = (await game.packs?.get('Ilaris.manover')?.getDocuments())?.find(
                    (item: any) => item.name === 'Umklammern',
                ) as any
                if (!actor || !sourceActor || !maneuver)
                    throw new Error('Umklammern-Testdaten fehlen.')

                const processor =
                    await import('/systems/Ilaris/scripts/effects/pre-effects/pre-effects-processor.js')
                const escape = await import('/systems/Ilaris/scripts/effects/opposed-escape.js')
                await processor.createActiveEffectFromPreEffect(
                    actor,
                    maneuver.system.preEffects[0],
                    sourceActor,
                    maneuver,
                    0,
                    0,
                    0,
                    foundry.utils.randomID(),
                    { inputValue: 1 },
                    'maneuver',
                )
                const effect = actor.effects.find(
                    (entry: any) =>
                        entry.name === 'Umklammern' &&
                        entry.flags?.ilaris?.sourceType === 'maneuver',
                ) as any
                if (!effect) throw new Error('Umklammern-Effekt wurde nicht erstellt.')

                const firstNonce = foundry.utils.randomID(16)
                const firstContext = {
                    nonce: firstNonce,
                    effectId: effect.id,
                    effectName: effect.name,
                    targetActorUuid: actor.uuid,
                    sourceActorUuid: sourceActor.uuid,
                }
                await effect.update({
                    'flags.ilaris.opposedEscapeAttempt': {
                        ...firstContext,
                        state: 'pending',
                    },
                })
                await escape.sendOpposedEscapeCounterPrompt(firstContext, { roll: { total: 8 } })
                const prompt = game.messages?.contents.at(-1) as any
                await escape.resolveOpposedEscapeCounterCheck(firstContext, { roll: { total: 12 } })
                const retained = !!actor.effects.get(effect.id)

                const secondNonce = foundry.utils.randomID(16)
                const secondContext = {
                    ...firstContext,
                    nonce: secondNonce,
                    escapeRoll: { roll: { total: 8 } },
                }
                await effect.update({
                    'flags.ilaris.opposedEscapeAttempt': {
                        ...secondContext,
                        state: 'pending',
                    },
                })
                await escape.resolveOpposedEscapeCounterCheck(secondContext, { roll: { total: 4 } })

                return {
                    effectId: effect.id,
                    choices: escape
                        .getOpposedEscapeAttributeOptions(actor)
                        .map((option: any) => option.key),
                    promptWhispered: (prompt?.whisper?.length || 0) > 0,
                    promptHasCounterButton: prompt?.content.includes(
                        'ilaris-opposed-escape-button',
                    ),
                    retainedAfterFailedEscape: retained,
                    deletedAfterSuccessfulEscape: !actor.effects.get(effect.id),
                }
            },
            { actorName: ACTOR_NAME, sourceActorName: SOURCE_ACTOR_NAME },
        )
        createdEffectIds.push(result.effectId)

        expect(result).toMatchObject({
            choices: ['GE', 'KK'],
            promptWhispered: true,
            promptHasCounterButton: true,
            retainedAfterFailedEscape: true,
            deletedAfterSuccessfulEscape: true,
        })
    })
})
