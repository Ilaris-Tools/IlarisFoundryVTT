import { IlarisActiveEffect } from '../active-effect.js'
import { resolveTargetActorForDamage } from '../../combat/dialogs/shared-dialog-helpers.js'
import { sendResistPrompt } from './resist-handler.js'

/**
 * Normalize Foundry V14 ObjectField data to a real array.
 * Foundry stores {0:{...}, 1:{...}} instead of [{...}, {...}].
 */
export function toArray(val) {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') return Object.values(val)
    return []
}

/**
 * Apply all pre-effects from a spell to its targets.
 * Called fire-and-forget — not awaited.
 *
 * @param {object} rollResult - The spell roll result
 * @param {UebernatuerlichDialog} dialog - The dialog instance
 */
export function applyPreEffects(rollResult, dialog) {
    const item = dialog.item
    const raw = item?.system?.preEffects
    // Foundry V14 stores ObjectField arrays as {0:{...}, 1:{...}} not [...]
    const preEffects = toArray(raw)
    if (!preEffects.length) return
    if (!dialog.selectedActors?.length) return

    const caster = dialog.actor
    const speaker = dialog.speaker

    // Compute maneuver duration bonus (from maneuvers that extend spell duration)
    const maneuverDurationBonus = dialog.maneuverDurationBonus || 0

    // Get Mächtige Magie/Liturgie QS from dialog
    const maechtigeQs = dialog.maechtigeMagieQs || 0

    for (const target of dialog.selectedActors) {
        const { targetActor } = resolveTargetActorForDamage(target)
        if (!targetActor) continue

        const isSelfCast = caster.id === targetActor.id

        for (let i = 0; i < preEffects.length; i++) {
            const preEffect = preEffects[i]
            const avoidTest = preEffect.avoidTest || {}

            // If resist test is enabled, send prompt instead of applying immediately
            if (avoidTest.enabled) {
                sendResistPromptForEffect(
                    targetActor,
                    preEffect,
                    item,
                    caster,
                    speaker,
                    maechtigeQs,
                    maneuverDurationBonus,
                    isSelfCast,
                )
                continue
            }

            // Compute effective duration
            const effectiveDuration =
                preEffect.baseDuration + maneuverDurationBonus + (isSelfCast ? 1 : 0)

            if (preEffect.instant) {
                applyInstantPreEffect(targetActor, preEffect, maechtigeQs, speaker)
            } else {
                createActiveEffectFromPreEffect(
                    targetActor,
                    preEffect,
                    caster,
                    item,
                    effectiveDuration,
                    maechtigeQs,
                )
            }
        }
    }
}

/**
 * Send a resist prompt for a pre-effect with avoidTest enabled.
 */
async function sendResistPromptForEffect(
    targetActor,
    preEffect,
    spellItem,
    caster,
    speaker,
    maechtigeQs,
    maneuverDurationBonus,
    isSelfCast,
) {
    const serialized = {
        ...preEffect,
        maneuverBonus: maneuverDurationBonus,
        isSelfCast,
        maechtigeQs,
        casterUuid: caster.uuid,
        spellUuid: spellItem.uuid,
        targetActorId: targetActor.id,
    }

    await sendResistPrompt(targetActor, serialized, spellItem.name, speaker)
}

/**
 * Apply an instant pre-effect (direct damage).
 * @param {Actor} targetActor
 * @param {object} preEffect
 * @param {number} maechtigeQs
 * @param {object} speaker
 */
export async function applyInstantPreEffect(targetActor, preEffect, maechtigeQs, speaker) {
    const { _applyDamageDirectly } = await import('../../combat/dialogs/shared-dialog-helpers.js')

    for (const change of toArray(preEffect.changes)) {
        let value = change.value || '0'

        // Apply Mächtige Magie amplification (per QS)
        if (change.amplifiedByMaechtigeMagie && maechtigeQs > 0 && change.maechtigBonus) {
            const bonus =
                change.maechtigBonus.startsWith('+') || change.maechtigBonus.startsWith('-')
                    ? change.maechtigBonus
                    : `+${change.maechtigBonus}`
            value = `${value}${bonus.repeat(maechtigeQs)}`
        }

        // Evaluate formula (convert Ilaris W notation to Foundry d notation)
        let resolvedValue
        try {
            const normalized = value.replace(/[Ww]/g, 'd')
            const roll = new Roll(normalized)
            await roll.evaluate()
            resolvedValue = roll.total
        } catch (e) {
            console.warn('Ilaris | Failed to evaluate instant pre-effect formula:', value, e)
            resolvedValue = parseInt(value) || 0
        }

        const damageType = change.damageType || 'PROFAN'

        await _applyDamageDirectly(targetActor, resolvedValue, damageType, false, speaker)
    }
}

/**
 * Create an ActiveEffect from a pre-effect template.
 * @param {Actor} targetActor
 * @param {object} preEffect
 * @param {Actor} caster
 * @param {Item} spellItem
 * @param {number} effectiveDuration
 * @param {number} maechtigeQs
 */
export async function createActiveEffectFromPreEffect(
    targetActor,
    preEffect,
    caster,
    spellItem,
    effectiveDuration,
    maechtigeQs,
) {
    const changes = []

    for (const change of toArray(preEffect.changes)) {
        let value = change.value || '0'

        // Apply Mächtige Magie amplification (per QS)
        if (change.amplifiedByMaechtigeMagie && maechtigeQs > 0 && change.maechtigBonus) {
            const bonus =
                change.maechtigBonus.startsWith('+') || change.maechtigBonus.startsWith('-')
                    ? change.maechtigBonus
                    : `+${change.maechtigBonus}`
            value = `${value}${bonus.repeat(maechtigeQs)}`
        }

        changes.push({
            key: change.key || '',
            mode:
                change.type === 'custom'
                    ? 10 // CONST.ACTIVE_EFFECT_MODES.CUSTOM
                    : change.type === 'multiply'
                      ? 4
                      : change.type === 'override'
                        ? 1
                        : 2, // default: ADD
            value: value,
            priority: change.priority || null,
        })
    }

    console.log(
        'Ilaris | createActiveEffectFromPreEffect: changes.length =',
        changes.length,
        'targetActor:',
        targetActor?.name,
        'spellItem:',
        spellItem?.name,
        'duration:',
        effectiveDuration,
    )

    if (changes.length === 0) return

    const effectData = {
        name: spellItem.name,
        origin: caster.uuid,
        changes: changes,
        duration: {
            turns: effectiveDuration,
        },
        system: {
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
            },
        },
    }

    try {
        await ActiveEffect.createDocuments([effectData], { parent: targetActor })
        console.log(
            'Ilaris | Created pre-effect ActiveEffect on',
            targetActor.name,
            ':',
            effectData.name,
        )
    } catch (e) {
        console.error('Ilaris | Failed to create pre-effect ActiveEffect:', e)
    }
}
