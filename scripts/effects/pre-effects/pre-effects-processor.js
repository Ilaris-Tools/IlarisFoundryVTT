import { resolveTargetActorForDamage } from '../../combat/dialogs/shared-dialog-helpers.js'
import { IlarisGameSettingNames } from '../../settings/configure-game-settings.model.js'
import { sendResistPrompt } from './resist-handler.js'
import {
    IlarisSupernaturalStackingMode,
    targetFromMainAttributePath,
} from '../utils/ilaris-modifier-constants.js'
import { materializeArmedCombat } from './armed-combat-effects.js'
import { summonItemFromPreEffect } from './summoned-items.js'

/** Normalize Foundry v14 ObjectField data to a real array. */
export function toArray(val) {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') return Object.values(val)
    return []
}

function getSupernaturalEffectStackingMode() {
    try {
        return (
            game.settings.get('Ilaris', IlarisGameSettingNames.supernaturalEffectStacking) ||
            IlarisSupernaturalStackingMode.Ilaris
        )
    } catch (_error) {
        return IlarisSupernaturalStackingMode.Ilaris
    }
}

function getActorEffects(targetActor) {
    if (Array.isArray(targetActor?.effects)) return targetActor.effects
    return Array.from(targetActor?.effects?.values?.() || [])
}

function matchesPreviousSpellApplication(effect, spellUuid, applicationId) {
    const flags = effect?.flags?.ilaris
    return (
        flags?.sourceType === 'uebernatuerlich' &&
        flags.spellUuid === spellUuid &&
        flags.applicationId !== applicationId
    )
}

async function replacePreviousSpellApplication(targetActor, spellUuid, applicationId) {
    if (getSupernaturalEffectStackingMode() !== IlarisSupernaturalStackingMode.Foundry) return

    const ids = getActorEffects(targetActor)
        .filter((effect) => matchesPreviousSpellApplication(effect, spellUuid, applicationId))
        .map((effect) => effect.id)
        .filter(Boolean)
    if (ids.length) await targetActor.deleteEmbeddedDocuments('ActiveEffect', ids)
}

/** Materialize amplified magic/liturgy values when an ActiveEffect is created. */
export function materializePreEffectValue(change, maechtigeQs, field = 'value') {
    let value = change?.[field] || '0'
    if (change?.amplifiedByMaechtigeMagie && maechtigeQs > 0 && change?.maechtigBonus) {
        const bonus =
            change.maechtigBonus.startsWith('+') || change.maechtigBonus.startsWith('-')
                ? change.maechtigBonus
                : `+${change.maechtigBonus}`
        value = `${value}${bonus.repeat(maechtigeQs)}`
    }
    return value
}

function materializeIlarisModifier(modifier, maechtigeQs) {
    return {
        phase: modifier.phase || 'roll',
        target: modifier.target || 'probe',
        value: materializePreEffectValue(modifier, maechtigeQs),
        stacking: modifier.stacking || 'add',
        comparisonValue:
            modifier.comparisonValue === undefined || modifier.comparisonValue === ''
                ? ''
                : materializePreEffectValue(modifier, maechtigeQs, 'comparisonValue'),
        selector: modifier.selector || {},
    }
}

function getEffectPayload(preEffect, maechtigeQs) {
    const changes = []
    const ilarisModifiers = toArray(preEffect.ilarisModifiers).map((modifier) =>
        materializeIlarisModifier(modifier, maechtigeQs),
    )

    for (const change of toArray(preEffect.changes)) {
        const target = targetFromMainAttributePath(change.key)
        if (target) {
            if (change.type && change.type !== 'add') {
                throw new TypeError('Direct attribute changes must be additive.')
            }
            ilarisModifiers.push({
                phase: 'roll',
                target,
                value: materializePreEffectValue(change, maechtigeQs),
                stacking: 'strongest-supernatural',
                comparisonValue: '',
                selector: {},
            })
            continue
        }
        changes.push({
            key: change.key || '',
            mode:
                change.type === 'custom'
                    ? 10
                    : change.type === 'multiply'
                      ? 4
                      : change.type === 'override'
                        ? 1
                        : 2,
            value: materializePreEffectValue(change, maechtigeQs),
            priority: change.priority || null,
        })
    }
    return { changes, ilarisModifiers }
}

/** Apply all pre-effects from a spell to its targets. */
export async function applyPreEffects(rollResult, dialog, armedInputValues = {}) {
    const item = dialog.item
    const preEffects = toArray(item?.system?.preEffects)
    if (!preEffects.length) return

    const caster = dialog.actor
    const speaker = dialog.speaker
    const maneuverDurationBonus = dialog.maneuverDurationBonus || 0
    const maechtigeQs = dialog.maechtigeMagieQs || 0

    const targets = dialog.selectedActors?.length ? dialog.selectedActors : [{ actorId: caster.id }]
    for (const target of targets) {
        const { targetActor } = resolveTargetActorForDamage(target)
        if (!targetActor) continue
        const isSelfCast = caster.id === targetActor.id
        const applicationId = foundry.utils.randomID()

        for (const [preEffectIndex, preEffect] of preEffects.entries()) {
            const avoidTest = preEffect.avoidTest || {}
            if (avoidTest.enabled) {
                await sendResistPromptForEffect(
                    targetActor,
                    preEffect,
                    item,
                    caster,
                    speaker,
                    maechtigeQs,
                    maneuverDurationBonus,
                    isSelfCast,
                    preEffectIndex,
                    applicationId,
                    armedInputValues,
                )
                continue
            }

            const effectiveDuration =
                preEffect.baseDuration + maneuverDurationBonus + (isSelfCast ? 1 : 0)
            if (preEffect.summonItem?.enabled || preEffect.summonItem?.sourceUuid) {
                await summonItemFromPreEffect({
                    targetActor,
                    preEffect,
                    caster,
                    spellItem: item,
                    effectiveDuration,
                    maechtigeQs,
                    preEffectIndex,
                    applicationId,
                })
            } else if (preEffect.instant) {
                await applyInstantPreEffect(targetActor, preEffect, maechtigeQs, speaker)
            } else {
                await createActiveEffectFromPreEffect(
                    targetActor,
                    preEffect,
                    caster,
                    item,
                    effectiveDuration,
                    maechtigeQs,
                    preEffectIndex,
                    applicationId,
                    armedInputValues,
                )
            }
        }
    }
}

async function sendResistPromptForEffect(
    targetActor,
    preEffect,
    spellItem,
    caster,
    speaker,
    maechtigeQs,
    maneuverDurationBonus,
    isSelfCast,
    preEffectIndex,
    applicationId,
    armedInputValues,
) {
    const serialized = {
        ...preEffect,
        maneuverBonus: maneuverDurationBonus,
        isSelfCast,
        maechtigeQs,
        casterUuid: caster.uuid,
        spellUuid: spellItem.uuid,
        targetActorId: targetActor.id,
        preEffectIndex,
        applicationId,
        armedInputValues,
    }
    await sendResistPrompt(targetActor, serialized, spellItem.name, speaker)
}

/** Apply an instant pre-effect (direct damage). */
export async function applyInstantPreEffect(targetActor, preEffect, maechtigeQs, speaker) {
    const { _applyDamageDirectly } = await import('../../combat/dialogs/shared-dialog-helpers.js')

    for (const change of toArray(preEffect.changes)) {
        const value = materializePreEffectValue(change, maechtigeQs)
        let resolvedValue
        try {
            const roll = new Roll(value.replace(/[Ww]/g, 'd'))
            await roll.evaluate()
            resolvedValue = roll.total
        } catch (error) {
            console.warn('Ilaris | Failed to evaluate instant pre-effect formula:', value, error)
            resolvedValue = parseInt(value) || 0
        }
        await _applyDamageDirectly(
            targetActor,
            resolvedValue,
            change.damageType || 'PROFAN',
            false,
            speaker,
        )
    }
}

/** Create a persistent ActiveEffect from a pre-effect template. */
export async function createActiveEffectFromPreEffect(
    targetActor,
    preEffect,
    caster,
    spellItem,
    effectiveDuration,
    maechtigeQs,
    preEffectIndex = 0,
    applicationId = foundry.utils.randomID(),
    armedInputValues = {},
) {
    let payload
    try {
        payload = getEffectPayload(preEffect, maechtigeQs)
    } catch (error) {
        ui?.notifications?.error(error.message)
        return
    }
    const { changes, ilarisModifiers } = payload
    const ilarisArmedCombat = materializeArmedCombat(
        preEffect.armedCombat,
        armedInputValues,
        maechtigeQs,
    )
    if (changes.length === 0 && ilarisModifiers.length === 0 && !ilarisArmedCombat) return

    const effectData = {
        name: spellItem.name,
        origin: caster.uuid,
        changes,
        duration: { turns: effectiveDuration },
        system: {
            ilarisSource: 'uebernatuerlich',
            ilarisModifiers,
            ilarisArmedCombat,
            ilarisTiming: {
                durationType: 'ownerTurns',
                expiresOn: 'turnEnd',
                remaining: effectiveDuration,
                originalValue: effectiveDuration,
            },
        },
        flags: {
            ilaris: {
                sourceType: 'uebernatuerlich',
                spellName: spellItem.name,
                spellUuid: spellItem.uuid,
                casterUuid: caster.uuid,
                fertigkeiten: spellItem.system?.fertigkeiten || '',
                preEffectIndex,
                applicationId,
            },
        },
    }

    try {
        await replacePreviousSpellApplication(targetActor, spellItem.uuid, applicationId)
        await ActiveEffect.createDocuments([effectData], { parent: targetActor })
        console.log(
            'Ilaris | Created pre-effect ActiveEffect on',
            targetActor.name,
            ':',
            effectData.name,
        )
    } catch (error) {
        console.error('Ilaris | Failed to create pre-effect ActiveEffect:', error)
    }
}
