import { getConditionSources, removeConditionSource } from './status-conditions.js'

const pendingRemovals = new Map()

function actorEffects(actor) {
    if (Array.isArray(actor?.effects)) return actor.effects
    return Array.from(actor?.effects?.values?.() || [])
}

/** Match the durable identity of one passive Zone application. */
export function isPassiveZoneEffect(effect, ownership = {}) {
    const flags = effect?.flags?.ilaris
    return Boolean(
        flags?.passiveZone === true &&
        flags.zoneRegionId === ownership.regionId &&
        flags.zoneApplicationId === ownership.applicationId &&
        flags.targetTokenId === ownership.tokenId &&
        flags.spellUuid === ownership.spellUuid &&
        flags.preEffectIndex === ownership.preEffectIndex,
    )
}

function isPassiveZoneConditionSource(source, ownership) {
    const zone = source?.passiveZone
    return Boolean(
        zone?.regionId === ownership.regionId &&
        zone.applicationId === ownership.applicationId &&
        zone.tokenId === ownership.tokenId &&
        zone.spellUuid === ownership.spellUuid &&
        zone.preEffectIndex === ownership.preEffectIndex,
    )
}

/** Remove only the ActiveEffects created by one passive Zone application. */
async function removePassiveZoneEffectsNow(actor, ownership) {
    if (!actor?.deleteEmbeddedDocuments) return []
    const ids = actorEffects(actor)
        .filter((effect) => isPassiveZoneEffect(effect, ownership))
        .map((effect) => effect.id)
        .filter(Boolean)
    if (ids.length) await actor.deleteEmbeddedDocuments('ActiveEffect', ids)
    for (const effect of actorEffects(actor)) {
        for (const source of getConditionSources(effect)) {
            if (isPassiveZoneConditionSource(source, ownership))
                await removeConditionSource(actor, effect, source.id)
        }
    }
    return ids
}

function removalKey(actor, ownership) {
    return [
        actor?.uuid || actor?.id || '',
        ownership?.regionId || '',
        ownership?.applicationId || '',
        ownership?.tokenId || '',
        ownership?.spellUuid || '',
        ownership?.preEffectIndex ?? '',
    ].join(':')
}

/** Remove only the ActiveEffects created by one passive Zone application. */
export async function removePassiveZoneEffects(actor, ownership) {
    const key = removalKey(actor, ownership)
    const existing = pendingRemovals.get(key)
    if (existing) return existing

    const removal = removePassiveZoneEffectsNow(actor, ownership)
    pendingRemovals.set(key, removal)
    try {
        return await removal
    } finally {
        if (pendingRemovals.get(key) === removal) pendingRemovals.delete(key)
    }
}
