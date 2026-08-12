import { resolveTargetActorForDamage } from '../../combat/dialogs/shared-dialog-helpers.js'
import { IlarisGameSettingNames } from '../../settings/configure-game-settings.model.js'
import { sendResistPrompt } from './resist-handler.js'
import {
    IlarisSupernaturalStackingMode,
    targetFromMainAttributePath,
} from '../utils/ilaris-modifier-constants.js'
import { materializeArmedCombat } from './armed-combat-effects.js'
import { summonItemFromPreEffect } from './summoned-items.js'
import { addConditionSource } from '../status-conditions.js'
import { isPassiveZoneEffect } from '../zone-effect-ownership.js'

const pendingPassiveZoneCreations = new Map()

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

function passiveZoneCreationKey(targetActor, ownership) {
    return [
        targetActor?.uuid || targetActor?.id || '',
        ownership.regionId,
        ownership.applicationId,
        ownership.tokenId,
        ownership.spellUuid,
        ownership.preEffectIndex,
    ].join(':')
}

function getActorItems(targetActor) {
    if (Array.isArray(targetActor?.items)) return targetActor.items
    return Array.from(targetActor?.items?.values?.() || [])
}

function getSelectedWeaponSlot(armedInputValues) {
    const selector = armedInputValues?.selector
    if (selector === 'Hauptwaffe') return 'hauptwaffe'
    if (selector === 'Nebenwaffe') return 'nebenwaffe'
    return ''
}

/** Apply the bounded non-effect maneuver operations after a pre-effect resolves. */
export async function applyPreEffectOperation(targetActor, preEffect, armedInputValues = {}) {
    if (preEffect?.operation !== 'deselectEquippedWeapon') return

    const slot = getSelectedWeaponSlot(armedInputValues)
    if (!slot) {
        ui?.notifications?.warn('Entwaffnen benötigt die Auswahl Hauptwaffe oder Nebenwaffe.')
        return
    }

    const weapon = getActorItems(targetActor).find(
        (item) =>
            (item.type === 'nahkampfwaffe' || item.type === 'fernkampfwaffe') &&
            item.system?.[slot],
    )
    if (!weapon) {
        ui?.notifications?.warn(
            `${targetActor.name} führt keine Waffe als ${slot === 'hauptwaffe' ? 'Hauptwaffe' : 'Nebenwaffe'}.`,
        )
        return
    }
    await weapon.update({ [`system.${slot}`]: false })
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

function materializeIlarisModifier(modifier, maechtigeQs, armedInputValues = {}) {
    const baseValue = materializePreEffectValue(modifier, maechtigeQs)
    const numericInput = Number(armedInputValues.inputValue)
    const value =
        modifier.scaleWithInput && Number.isFinite(numericInput)
            ? String(Number(baseValue) * numericInput)
            : baseValue
    return {
        phase: modifier.phase || 'roll',
        target: modifier.target || 'probe',
        value,
        stacking: modifier.stacking || 'add',
        comparisonValue:
            modifier.comparisonValue === undefined || modifier.comparisonValue === ''
                ? ''
                : materializePreEffectValue(modifier, maechtigeQs, 'comparisonValue'),
        selector: modifier.selector || {},
    }
}

function getEffectPayload(preEffect, maechtigeQs, armedInputValues = {}) {
    const changes = []
    const ilarisModifiers = toArray(preEffect.ilarisModifiers).map((modifier) =>
        materializeIlarisModifier(modifier, maechtigeQs, armedInputValues),
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
export async function applyPreEffects(rollResult, dialog, armedInputValues = {}, context = {}) {
    const item = context.sourceItem || dialog.item
    const preEffects = toArray(context.preEffects || item?.system?.preEffects)
    if (!preEffects.length) return

    const caster = context.sourceActor || dialog.actor
    const sourceType = context.sourceType || 'uebernatuerlich'
    const speaker = dialog.speaker
    const maneuverDurationBonus = dialog.maneuverDurationBonus || 0
    const maechtigeQs = dialog.maechtigeMagieQs || 0
    const triggeringRollTotal = Number(rollResult?.roll?.total)

    const targets = dialog.selectedActors?.length ? dialog.selectedActors : [{ actorId: caster.id }]
    for (const target of targets) {
        const { targetActor } = resolveTargetActorForDamage(target)
        if (!targetActor) continue
        const isSelfCast = caster.id === targetActor.id
        const passiveZone = context.passiveZone || null
        const applicationId = passiveZone
            ? `${passiveZone.applicationId}:${target.tokenId}`
            : context.applicationId
              ? `${context.applicationId}:${targetActor.id}`
              : foundry.utils.randomID()

        for (const [preEffectIndex, preEffect] of preEffects.entries()) {
            const avoidTest = preEffect.avoidTest || {}
            if (avoidTest.enabled) {
                await sendResistPromptForEffect(
                    targetActor,
                    target,
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
                    sourceType,
                    triggeringRollTotal,
                    context.spellModificationId || '',
                    context.zoneRegionId || '',
                    passiveZone,
                    target.tokenId || '',
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
                    spellModificationId: context.spellModificationId || '',
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
                    sourceType,
                    context.spellModificationId || '',
                    context.zoneRegionId || '',
                    passiveZone,
                    target.tokenId || '',
                )
            }
        }
    }
}

async function sendResistPromptForEffect(
    targetActor,
    target,
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
    sourceType,
    triggeringRollTotal,
    spellModificationId,
    zoneRegionId,
    passiveZone,
    targetTokenId,
) {
    const serialized = {
        ...preEffect,
        maneuverBonus: maneuverDurationBonus,
        isSelfCast,
        maechtigeQs,
        casterUuid: caster.uuid,
        spellUuid: spellItem.uuid,
        targetActorId: targetActor.id,
        target: {
            actorId: target?.actorId || targetActor.id,
            tokenId: target?.tokenId || '',
            actorLink: target?.actorLink ?? true,
        },
        preEffectIndex,
        applicationId,
        armedInputValues,
        sourceType,
        spellModificationId,
        zoneRegionId,
        passiveZone,
        targetTokenId,
        ...(Number.isFinite(triggeringRollTotal) ? { triggeringRollTotal } : {}),
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
    sourceType = 'uebernatuerlich',
    spellModificationId = '',
    zoneRegionId = '',
    passiveZone = null,
    targetTokenId = '',
) {
    let payload
    try {
        payload = getEffectPayload(preEffect, maechtigeQs, armedInputValues)
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
    await applyPreEffectOperation(targetActor, preEffect, armedInputValues)
    const durationType = passiveZone ? 'infinite' : preEffect.durationType || 'ownerTurns'

    // Older pre-effects may only contain a statusId. In newly authored
    // pre-effects, an explicitly disabled condition must not be applied.
    const conditionStatusId =
        preEffect.condition?.enabled === false ? '' : preEffect.condition?.statusId
    if (conditionStatusId) {
        await addConditionSource(targetActor, conditionStatusId, {
            id: `${applicationId}:${preEffectIndex}`,
            type: 'preEffect',
            origin: spellItem.uuid,
            ...(passiveZone
                ? {
                      passiveZone: {
                          regionId: passiveZone.regionId,
                          applicationId,
                          tokenId: targetTokenId,
                          spellUuid: spellItem.uuid,
                          preEffectIndex,
                      },
                  }
                : {}),
            ...(durationType === 'ownerTurns'
                ? {
                      timing: {
                          durationType,
                          expiresOn: 'turnEnd',
                          remaining: effectiveDuration,
                      },
                  }
                : {}),
        })
    }

    const ilarisEnding = preEffect.ilarisEnding?.type
        ? { ...preEffect.ilarisEnding, sourceActorUuid: caster.uuid }
        : {}
    const ilarisMarker = preEffect.marker?.enabled === true
    if (
        changes.length === 0 &&
        ilarisModifiers.length === 0 &&
        !ilarisArmedCombat &&
        !ilarisEnding.type &&
        !ilarisMarker
    )
        return

    const effectData = {
        name: spellItem.name,
        origin: caster.uuid,
        changes,
        duration: durationType === 'ownerTurns' ? { turns: effectiveDuration } : {},
        system: {
            ilarisSource: 'uebernatuerlich',
            ilarisModifiers,
            ilarisArmedCombat,
            ilarisEnding,
            ilarisMarker,
            ilarisTiming: {
                durationType,
                expiresOn: 'turnEnd',
                remaining: durationType === 'infinite' ? 0 : effectiveDuration,
                originalValue: durationType === 'infinite' ? 0 : effectiveDuration,
            },
        },
        flags: {
            ilaris: {
                sourceType,
                spellName: spellItem.name,
                spellUuid: spellItem.uuid,
                casterUuid: caster.uuid,
                sourceActorUuid: caster.uuid,
                maneuverUuid: sourceType === 'maneuver' ? spellItem.uuid : '',
                fertigkeiten: spellItem.system?.fertigkeiten || '',
                preEffectIndex,
                applicationId,
                spellModificationId,
                zoneRegionId: passiveZone?.regionId || zoneRegionId,
                zoneApplicationId: passiveZone ? applicationId : '',
                passiveZone: Boolean(passiveZone),
                targetTokenId:
                    targetTokenId || preEffect.target?.tokenId || preEffect.targetTokenId || '',
            },
        },
    }

    const createEffect = async () => {
        try {
            if (
                sourceType === 'maneuver' &&
                getActorEffects(targetActor).some(
                    (effect) =>
                        effect?.flags?.ilaris?.sourceType === 'maneuver' &&
                        effect.flags.ilaris.applicationId === applicationId &&
                        effect.flags.ilaris.preEffectIndex === preEffectIndex,
                )
            )
                return
            if (
                passiveZone &&
                getActorEffects(targetActor).some((effect) =>
                    isPassiveZoneEffect(effect, {
                        regionId: passiveZone.regionId,
                        applicationId,
                        tokenId: targetTokenId,
                        spellUuid: spellItem.uuid,
                        preEffectIndex,
                    }),
                )
            )
                return
            if (!passiveZone)
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

    if (!passiveZone) return createEffect()
    const ownership = {
        regionId: passiveZone.regionId,
        applicationId,
        tokenId: targetTokenId,
        spellUuid: spellItem.uuid,
        preEffectIndex,
    }
    const key = passiveZoneCreationKey(targetActor, ownership)
    const existing = pendingPassiveZoneCreations.get(key)
    if (existing) return existing

    const creation = createEffect()
    pendingPassiveZoneCreations.set(key, creation)
    try {
        return await creation
    } finally {
        if (pendingPassiveZoneCreations.get(key) === creation)
            pendingPassiveZoneCreations.delete(key)
    }
}
