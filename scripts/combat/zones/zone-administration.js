const FLAG_SCOPE = 'Ilaris'
const FLAG_KEY = 'zone'

function regionsOf(scene) {
    if (!scene?.regions) return []
    if (Array.isArray(scene.regions)) return scene.regions
    return Array.from(scene.regions.values?.() || scene.regions)
}

function zoneState(region) {
    return region?.flags?.[FLAG_SCOPE]?.[FLAG_KEY] || null
}

function triggerLabel(trigger = {}) {
    const labels = []
    if (trigger.triggerOnCreate) labels.push('Beim Erzeugen')
    if (trigger.onEnter) labels.push('Beim Betreten')
    if (trigger.onTraverse) labels.push('Beim Durchqueren')
    if (trigger.onTurnStart) labels.push('Zu Beginn des Zuges')
    if (trigger.onRoundStart) labels.push('Je Kampfrunde')
    return labels.length ? labels.join(', ') : 'Keine Auslösung'
}

/** Return true only for the persisted Zone shape handled by zone lifecycles. */
export function isValidPersistentIlarisZone(region) {
    const zone = zoneState(region)
    if (!zone || !region?.id) return false
    if (zone.profile?.lifecycle !== 'persistent') return false
    if (!zone.applicationId || !zone.spellUuid) return false
    const durationType = zone.durationType || zone.profile?.duration?.type
    return durationType === 'sceneRounds' || durationType === 'infinite'
}

export function getZoneAdministrationRegistry(scene) {
    const zones = []
    const malformed = []
    for (const region of regionsOf(scene)) {
        const zone = zoneState(region)
        if (!zone) continue
        if (!isValidPersistentIlarisZone(region)) {
            malformed.push({
                id: region.id || '',
                name: region.name || 'Unbenannte Region',
                reason: 'Unvollständige Ilaris-Zonenmetadaten',
            })
            continue
        }
        const durationType = zone.durationType || zone.profile?.duration?.type
        const membership = Array.isArray(zone.membership) ? zone.membership : []
        zones.push({
            id: region.id,
            name: region.name || 'Ilaris Zone',
            spellUuid: zone.spellUuid,
            casterUuid: zone.casterUuid || '',
            applicationId: zone.applicationId,
            effectMode: zone.profile?.effectMode || 'triggered',
            triggerLabel: triggerLabel(zone.profile?.trigger),
            durationType,
            remaining: Number(zone.remaining || 0),
            membershipCount: membership.length,
            membership,
        })
    }
    return {
        zones: zones.sort((left, right) => left.name.localeCompare(right.name, 'de')),
        malformed: malformed.sort((left, right) => left.name.localeCompare(right.name, 'de')),
    }
}

export function getCurrentZoneRegion(scene, regionId) {
    const region =
        scene?.regions?.get?.(regionId) || regionsOf(scene).find((entry) => entry.id === regionId)
    if (!region) throw new Error('Diese Zone existiert nicht mehr.')
    if (!isValidPersistentIlarisZone(region))
        throw new Error('Diese Region ist keine gültige Ilaris-Zone.')
    return region
}

export function validateZoneRemaining(value) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || !Number.isInteger(numeric))
        throw new Error('Die verbleibende Dauer muss eine ganze Zahl sein.')
    if (numeric < 1) throw new Error('Eine Zone benötigt mindestens eine Szenenrunde.')
    return numeric
}

/** Persist exactly the remaining scene-round value of one current Zone. */
export async function updateZoneRemaining(scene, regionId, value) {
    const region = getCurrentZoneRegion(scene, regionId)
    const durationType = zoneState(region).durationType || zoneState(region).profile?.duration?.type
    if (durationType === 'infinite')
        throw new Error('Diese Zone ist permanent und hat keine Dauer.')
    const remaining = validateZoneRemaining(value)
    await region.update({ [`flags.${FLAG_SCOPE}.${FLAG_KEY}.remaining`]: remaining })
    return region
}

export async function dismissZone(scene, regionId) {
    const region = getCurrentZoneRegion(scene, regionId)
    await region.delete()
    return region
}
