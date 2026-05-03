const MIRRORED_COMBAT_HOOKS = new Set([
    'Ilaris.preCombatDialog',
    'Ilaris.combatDialogRendered',
    'Ilaris.preTargetSelection',
    'Ilaris.targetSelectionComplete',
    'Ilaris.preAngriff',
    'Ilaris.postAngriff',
    'Ilaris.preVerteidigung',
    'Ilaris.postVerteidigung',
    'Ilaris.preSchaden',
    'Ilaris.postSchaden',
])

function getMirrorHookName(hookName) {
    return `Ilaris.global.${hookName.replace(/^Ilaris\./, '')}`
}

function summarizeDocument(doc) {
    if (!doc || typeof doc !== 'object') return null
    if (!('id' in doc) || !('name' in doc)) return null

    return {
        kind: doc.documentName || doc.constructor?.name || 'Document',
        id: doc.id,
        name: doc.name,
        type: doc.type,
    }
}

function summarizeRollResult(rollResult) {
    if (!rollResult || typeof rollResult !== 'object') return null
    if (!('roll' in rollResult)) return null

    return {
        total: rollResult.roll?.total,
        success: rollResult.success,
        crit: rollResult.crit,
        fumble: rollResult.fumble,
        is16OrHigher: rollResult.is16OrHigher,
    }
}

function summarizeDialog(dialog) {
    if (!dialog || typeof dialog !== 'object') return null
    if (!('actor' in dialog) && !('item' in dialog)) return null

    return {
        kind: dialog.constructor?.name || 'CombatDialog',
        actor: summarizeDocument(dialog.actor),
        item: summarizeDocument(dialog.item),
        attackType: dialog.attackType,
        isDefenseMode: dialog.isDefenseMode,
        selectedActors: Array.isArray(dialog.selectedActors)
            ? dialog.selectedActors.map((target) => ({
                  tokenId: target?.tokenId,
                  actorId: target?.actorId,
                  actorLink: target?.actorLink,
                  name: target?.name,
                  distance: target?.distance,
              }))
            : [],
    }
}

function summarizeValue(value) {
    const doc = summarizeDocument(value)
    if (doc) return doc

    const roll = summarizeRollResult(value)
    if (roll) return roll

    const dialog = summarizeDialog(value)
    if (dialog) return dialog

    if (Array.isArray(value)) {
        return value.map((entry) => summarizeValue(entry))
    }

    if (value && typeof value === 'object') {
        return {
            kind: 'Object',
            keys: Object.keys(value),
        }
    }

    return value
}

function emitGlobalCombatHook(hookName, args) {
    if (!MIRRORED_COMBAT_HOOKS.has(hookName)) return

    const payload = {
        eventId: foundry.utils.randomID(16),
        originUserId: game.user.id,
        hookName,
        mirrorHookName: getMirrorHookName(hookName),
        argsSummary: args.map((arg) => summarizeValue(arg)),
        ts: Date.now(),
    }

    // Sender should also receive the mirrored global hook.
    Hooks.callAll(payload.mirrorHookName, payload)

    game?.socket?.emit('system.Ilaris', {
        type: 'broadcastCombatHook',
        data: payload,
    })
}

export function callIlarisHookWithGlobalMirror(hookName, ...args) {
    const result = Hooks.call(hookName, ...args)

    if (result !== false) {
        emitGlobalCombatHook(hookName, args)
    }

    return result
}

export function callIlarisHookAllWithGlobalMirror(hookName, ...args) {
    Hooks.callAll(hookName, ...args)
    emitGlobalCombatHook(hookName, args)
}

export async function handleBroadcastCombatHookRequest(data) {
    const { eventId, originUserId, mirrorHookName } = data || {}

    if (!eventId || !originUserId || !mirrorHookName) return
    if (originUserId === game.user.id) return

    if (!window._ilarisProcessedCombatHookEvents) {
        window._ilarisProcessedCombatHookEvents = new Set()
    }

    if (window._ilarisProcessedCombatHookEvents.has(eventId)) return
    window._ilarisProcessedCombatHookEvents.add(eventId)

    if (window._ilarisProcessedCombatHookEvents.size > 1000) {
        const iterator = window._ilarisProcessedCombatHookEvents.values()
        const first = iterator.next().value
        window._ilarisProcessedCombatHookEvents.delete(first)
    }

    Hooks.callAll(mirrorHookName, data)
}
