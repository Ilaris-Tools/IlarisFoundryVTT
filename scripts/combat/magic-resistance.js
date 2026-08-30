const SINGLE_ACTOR_TARGET_MODE = 'singleActor'

export function normalizeMagicResistance(value, { absentValue = null } = {}) {
    if (value === undefined) return absentValue
    if (!value || typeof value !== 'object') return { enabled: false, targetMode: '' }
    if (value.enabled === true && value.targetMode === SINGLE_ACTOR_TARGET_MODE) {
        return { enabled: true, targetMode: SINGLE_ACTOR_TARGET_MODE }
    }
    return { enabled: false, targetMode: '' }
}

export function getActorMagicResistance(actor) {
    if (!actor) return 0
    const value =
        actor.type === 'kreatur' ? actor.system?.kampfwerte?.mr : actor.system?.abgeleitete?.mr
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

export function resolveMagicResistanceTarget(selectedActors, { resolveActor } = {}) {
    const targets = Array.isArray(selectedActors) ? selectedActors : []
    if (targets.length !== 1 || typeof resolveActor !== 'function') return null
    const selectedTarget = targets[0]
    const actor = resolveActor(selectedTarget)
    if (!actor) return null
    return { selectedTarget, actor, magicResistance: getActorMagicResistance(actor) }
}

export function createMagicResistanceChallenge({
    dialogId,
    target,
    executorUserId,
    requestId,
} = {}) {
    if (!dialogId || !target?.actor || !requestId) return null
    return {
        id: requestId,
        dialogId,
        targetActorUuid: target.actor.uuid || '',
        targetActorId: target.actor.id || target.selectedTarget?.actorId || '',
        targetTokenId: target.selectedTarget?.tokenId || '',
        targetName: target.actor.name || target.selectedTarget?.name || '',
        magicResistance: target.magicResistance,
        executorUserId: executorUserId || '',
        d20: null,
        difficulty: null,
    }
}

export function acceptMagicResistanceResult(challenge, result) {
    if (!challenge || challenge.d20 !== null || !result || result.requestId !== challenge.id)
        return null
    if (result.dialogId && result.dialogId !== challenge.dialogId) return null
    if (result.targetActorUuid && result.targetActorUuid !== challenge.targetActorUuid) return null
    const d20 = Number(result.d20)
    if (!Number.isInteger(d20) || d20 < 1 || d20 > 20) return null
    return { ...challenge, d20, difficulty: challenge.magicResistance + d20 }
}

export const MagicResistanceTargetMode = Object.freeze({ SINGLE_ACTOR: SINGLE_ACTOR_TARGET_MODE })
