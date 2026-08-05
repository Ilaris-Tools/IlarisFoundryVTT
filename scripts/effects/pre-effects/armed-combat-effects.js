/** Utilities for declarative supernatural effects that arm a later weapon attack. */

const ATTACK_SCOPES = new Set(['melee', 'ranged', 'any'])

function asInteger(value, fallback = 0) {
    const number = Number(value)
    return Number.isFinite(number) ? Math.trunc(number) : fallback
}

export function normalizeArmedInput(input = {}, submittedValue) {
    const min = asInteger(input.min, 0)
    const max = Math.max(min, asInteger(input.max, min))
    const value = asInteger(submittedValue, asInteger(input.default, min))
    return Math.min(max, Math.max(min, value))
}

export function materializeArmedCombat(armedCombat, submittedValues = {}, maechtigeQs = 0) {
    if (
        !armedCombat ||
        armedCombat.enabled === false ||
        armedCombat.trigger !== 'nextSuccessfulAttack'
    )
        return null

    const inputs = {}
    for (const input of Array.isArray(armedCombat.inputs) ? armedCombat.inputs : []) {
        if (!input?.key) continue
        inputs[input.key] = normalizeArmedInput(input, submittedValues[input.key])
    }

    const chargeConfig = armedCombat.charges || { base: 1 }
    const baseCharges = Math.max(1, asInteger(chargeConfig.base, 1))
    const bonus = chargeConfig.amplifiedByMaechtigeMagie
        ? Math.max(0, asInteger(chargeConfig.maechtigBonus, 0)) *
          Math.max(0, asInteger(maechtigeQs, 0))
        : 0

    return {
        trigger: 'nextSuccessfulAttack',
        scope: ATTACK_SCOPES.has(armedCombat.scope) ? armedCombat.scope : 'any',
        inputs,
        attackBonus: asInteger(armedCombat.attackBonus, 0),
        damage: armedCombat.damage?.perInput
            ? {
                  input: armedCombat.damage.input,
                  perInput: armedCombat.damage.perInput,
                  units: Math.max(0, inputs[armedCombat.damage.input] || 0),
              }
            : null,
        remainingCharges: baseCharges + bonus,
    }
}

export function getArmedAttackContext(actor, attackType) {
    const effects = Array.from(actor?.appliedEffects || actor?.effects || [])
    const effectsSnapshot = effects
        .map((effect) => ({ id: effect.id || effect._id, armed: effect.system?.ilarisArmedCombat }))
        .filter(
            ({ id, armed }) => id && armed && (armed.scope === 'any' || armed.scope === attackType),
        )
        .filter(({ armed }) => Number(armed.remainingCharges) > 0)

    return {
        attackType,
        effects: effectsSnapshot.map(({ id, armed }) => ({
            effectId: id,
            attackBonus: asInteger(armed.attackBonus, 0),
            damage: armed.damage || null,
        })),
    }
}

export function getArmedAttackBonus(context) {
    return (context?.effects || []).reduce(
        (total, effect) => total + asInteger(effect.attackBonus),
        0,
    )
}

export function getArmedDamageFormula(context) {
    return (context?.effects || [])
        .map(({ damage }) => {
            const units = Math.max(0, asInteger(damage?.units, 0))
            return units && damage?.perInput ? `${units}${damage.perInput}` : ''
        })
        .filter(Boolean)
        .join(' + ')
}

/** Consume only the already-snapshotted source effects; never re-resolve active effects. */
export async function resolveArmedAttack(actor, context, { confirmedHit = false } = {}) {
    const updates = []
    const deletes = []
    for (const { effectId } of context?.effects || []) {
        const effect =
            actor?.effects?.get?.(effectId) ||
            actor?.appliedEffects?.find?.((entry) => entry.id === effectId)
        const remaining = Math.max(
            0,
            asInteger(effect?.system?.ilarisArmedCombat?.remainingCharges, 0),
        )
        if (!effect || remaining < 1) continue
        if (remaining === 1) deletes.push(effectId)
        else
            updates.push({
                _id: effectId,
                'system.ilarisArmedCombat.remainingCharges': remaining - 1,
            })
    }
    if (updates.length) await actor.updateEmbeddedDocuments('ActiveEffect', updates)
    if (deletes.length) await actor.deleteEmbeddedDocuments('ActiveEffect', deletes)
    return confirmedHit ? getArmedDamageFormula(context) : ''
}
