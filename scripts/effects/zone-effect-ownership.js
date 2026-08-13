import { getConditionSources, removeConditionSource } from './status-conditions.js'

const pendingRemovals = new Map()
const pendingTraversalMarkerCreates = new Map()

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

/** Match one neutral marker created after a failed wall traversal. */
export function isZoneTraversalMarker(effect, ownership = {}) {
    const flags = effect?.flags?.ilaris
    return Boolean(
        flags?.zoneTraversalMarker === true &&
        flags.zoneRegionId === ownership.regionId &&
        flags.zoneApplicationId === ownership.applicationId &&
        flags.targetTokenId === ownership.tokenId &&
        flags.spellUuid === ownership.spellUuid,
    )
}

/** Create at most one visible, mechanically neutral marker for one wall traversal. */
export async function upsertZoneTraversalMarker(actor, ownership, { name, origin = '' } = {}) {
    if (!actor?.createEmbeddedDocuments) return null
    const existing = actorEffects(actor).find((effect) => isZoneTraversalMarker(effect, ownership))
    if (existing) return existing
    const key = removalKey(actor, { ...ownership, preEffectIndex: 'traversal-marker' })
    const pending = pendingTraversalMarkerCreates.get(key)
    if (pending) return pending
    const creation = (async () => {
        const [marker] = await actor.createEmbeddedDocuments('ActiveEffect', [
            {
                name: name || 'Durchquerung fehlgeschlagen',
                origin,
                changes: [],
                duration: {},
                system: {
                    ilarisTiming: {
                        durationType: 'infinite',
                        expiresOn: 'turnEnd',
                        remaining: 0,
                        originalValue: 0,
                    },
                },
                flags: {
                    ilaris: {
                        zoneTraversalMarker: true,
                        zoneRegionId: ownership.regionId,
                        zoneApplicationId: ownership.applicationId,
                        targetTokenId: ownership.tokenId,
                        spellUuid: ownership.spellUuid,
                    },
                },
            },
        ])
        return marker || null
    })()
    pendingTraversalMarkerCreates.set(key, creation)
    try {
        return await creation
    } finally {
        if (pendingTraversalMarkerCreates.get(key) === creation)
            pendingTraversalMarkerCreates.delete(key)
    }
}

/** Remove only traversal markers owned by one wall Region and target Token. */
export async function removeZoneTraversalMarkers(actor, ownership) {
    if (!actor?.deleteEmbeddedDocuments) return []
    const ids = actorEffects(actor)
        .filter((effect) => isZoneTraversalMarker(effect, ownership))
        .map((effect) => effect.id)
        .filter(Boolean)
    if (ids.length) await actor.deleteEmbeddedDocuments('ActiveEffect', ids)
    return ids
}

/** Remove all traversal markers created by one Region, regardless of former Token membership. */
export async function removeZoneTraversalMarkersForRegion(actor, ownership = {}) {
    if (!actor?.deleteEmbeddedDocuments) return []
    const ids = actorEffects(actor)
        .filter((effect) => {
            const flags = effect?.flags?.ilaris
            return (
                flags?.zoneTraversalMarker === true &&
                flags.zoneRegionId === ownership.regionId &&
                flags.zoneApplicationId === ownership.applicationId &&
                flags.spellUuid === ownership.spellUuid
            )
        })
        .map((effect) => effect.id)
        .filter(Boolean)
    if (ids.length) await actor.deleteEmbeddedDocuments('ActiveEffect', ids)
    return ids
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
