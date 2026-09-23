const pendingBallisticResolutions = new Map()

/** Register one target-specific ballistic completion on the initiating client. */
export function registerBallisticResolution({ resolutionId, initiatorUserId, onResolved } = {}) {
    if (!resolutionId || !initiatorUserId || typeof onResolved !== 'function') return false
    pendingBallisticResolutions.set(resolutionId, { initiatorUserId, onResolved })
    return true
}

/**
 * Consume a target-owned defense result exactly once. Socket listeners call
 * this on every connected client; only the initiating client owns the entry.
 */
export async function resolveBallisticDefenseOutcome(data = {}) {
    const { resolutionId, initiatorUserId } = data
    if (!resolutionId || initiatorUserId !== globalThis.game?.user?.id) return false
    const pending = pendingBallisticResolutions.get(resolutionId)
    if (!pending || pending.initiatorUserId !== initiatorUserId) return false

    pendingBallisticResolutions.delete(resolutionId)
    await pending.onResolved(data)
    return true
}

/** Broadcast a resolved outcome and apply it locally when this client initiated it. */
export async function dispatchBallisticDefenseOutcome(data = {}) {
    await resolveBallisticDefenseOutcome(data)
    globalThis.game?.socket?.emit('system.Ilaris', {
        type: 'resolveBallisticSpellDefense',
        data,
    })
}
