const SHAPES = new Set(['cone', 'circle', 'rectangle'])
const MAIN_ATTRIBUTES = new Set(['MU', 'KL', 'IN', 'CH', 'FF', 'GE', 'KO', 'KK'])

function numeric(value, fallback = 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function defaultPivot(shape) {
    if (shape === 'cone') return 'tip'
    if (shape === 'rectangle') return 'topLeft'
    return 'center'
}

function clone(value) {
    if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(value)
    return JSON.parse(JSON.stringify(value))
}

function normalizeDuration(rawDuration = {}) {
    const source = rawDuration.source === 'casterAttribute' ? 'casterAttribute' : 'fixed'
    const attribute = typeof rawDuration.attribute === 'string' ? rawDuration.attribute : ''
    if (source === 'casterAttribute' && !MAIN_ATTRIBUTES.has(attribute)) return null
    const remaining = numeric(rawDuration.remaining ?? rawDuration.value, 0)
    return {
        source,
        attribute,
        remaining,
        originalValue: numeric(rawDuration.originalValue, remaining),
    }
}

/** Snapshot an opt-in caster attribute into an ordinary persistent Zone duration. */
export function resolvePersistentZoneDuration(profile, caster) {
    if (profile?.lifecycle !== 'persistent' || profile?.duration?.source !== 'casterAttribute')
        return clone(profile)

    const attribute = profile.duration.attribute
    const value = Number(caster?.system?.attribute?.[attribute]?.wert)
    if (!MAIN_ATTRIBUTES.has(attribute) || !Number.isInteger(value) || value <= 0) return null

    const resolved = clone(profile)
    resolved.duration = {
        type: 'sceneRounds',
        remaining: value,
        originalValue: value,
    }
    return resolved
}

function normalizeTraversal(source = {}) {
    const avoidTest = source.avoidTest || {}
    const attribut = typeof avoidTest.attribut === 'string' ? avoidTest.attribut : ''
    const fertigkeit = typeof avoidTest.fertigkeit === 'string' ? avoidTest.fertigkeit : ''
    if (!attribut && !fertigkeit) return null
    return {
        avoidTest: {
            enabled: true,
            attribut,
            fertigkeit,
            talent: typeof avoidTest.talent === 'string' ? avoidTest.talent : '',
            resistDifficulty: numeric(avoidTest.resistDifficulty, 12),
            resistDifficultySource: avoidTest.resistDifficultySource || 'fixed',
        },
        failureMarker: {
            name:
                typeof source.failureMarker?.name === 'string'
                    ? source.failureMarker.name
                    : 'Durchquerung fehlgeschlagen',
        },
    }
}

function normalizeMovementResistance(source = {}) {
    if (source?.enabled !== true) return null
    const attribut = typeof source.attribut === 'string' ? source.attribut : ''
    if (!MAIN_ATTRIBUTES.has(attribut)) return null
    return {
        enabled: true,
        attribut,
        resistDifficulty: numeric(source.resistDifficulty, 12),
        failureMarker: {
            name:
                typeof source.failureMarker?.name === 'string'
                    ? source.failureMarker.name
                    : 'Bewegung fehlgeschlagen',
        },
    }
}

export function normalizeZoneProfile(source) {
    if (!source || typeof source !== 'object') return null
    const shape = SHAPES.has(source.shape) ? source.shape : null
    if (!shape) return null

    const placement = source.placement || {}
    const lifecycle = source.lifecycle === 'persistent' ? 'persistent' : 'instant'
    const effectMode = source.effectMode === 'passive' ? 'passive' : 'triggered'
    const rawDuration = source.duration || {}
    const duration = normalizeDuration(rawDuration)
    const distance = numeric(source.distance)
    const angle = numeric(source.angle, 45)
    const width = numeric(source.width, 1)
    if (distance <= 0 || (shape === 'cone' && angle <= 0) || (shape === 'rectangle' && width <= 0))
        return null
    if (lifecycle === 'persistent' && !duration) return null
    if (lifecycle === 'persistent' && duration.source === 'fixed' && duration.remaining <= 0)
        return null
    if (effectMode === 'passive' && lifecycle !== 'persistent') return null

    const triggerOnCreate = source.trigger?.triggerOnCreate !== false
    const onTraverse = source.trigger?.onTraverse === true
    if (
        onTraverse &&
        (shape !== 'rectangle' ||
            lifecycle !== 'persistent' ||
            effectMode === 'passive' ||
            triggerOnCreate ||
            source.trigger?.onEnter === true)
    )
        return null
    const traversal = onTraverse ? normalizeTraversal(source.traversal) : null
    if (onTraverse && !traversal) return null
    const movementResistance = normalizeMovementResistance(source.movementResistance)
    if (source.movementResistance?.enabled === true && !movementResistance) return null

    const profile = {
        shape,
        distance,
        ...(shape === 'cone' ? { angle } : {}),
        ...(shape === 'rectangle' ? { width } : {}),
        placement: {
            anchor: placement.anchor || 'caster',
            range: numeric(placement.range),
            pivot: placement.pivot || defaultPivot(shape),
        },
        lifecycle,
        effectMode,
        trigger: {
            triggerOnCreate,
            onEnter: source.trigger?.onEnter === true,
            onTurnStart: source.trigger?.onTurnStart === true,
            onRoundStart: source.trigger?.onRoundStart === true,
            onTraverse,
        },
        targeting: {
            includeCaster: source.targeting?.includeCaster === true,
        },
    }
    if (lifecycle === 'persistent') {
        profile.duration = {
            type: 'sceneRounds',
            ...(duration.source === 'casterAttribute'
                ? { source: duration.source, attribute: duration.attribute }
                : {}),
            remaining: duration.remaining,
            originalValue: duration.originalValue,
        }
    }
    if (traversal) profile.traversal = traversal
    if (movementResistance) profile.movementResistance = movementResistance
    return profile
}

export function resolveZoneProfile(baseProfile, modificationProfile) {
    if (modificationProfile === false) return null
    if (!baseProfile && !modificationProfile) return null
    const base = baseProfile && typeof baseProfile === 'object' ? baseProfile : {}
    const modification =
        modificationProfile && typeof modificationProfile === 'object' ? modificationProfile : {}
    return normalizeZoneProfile({
        ...base,
        ...modification,
        placement: { ...(base.placement || {}), ...(modification.placement || {}) },
        duration: { ...(base.duration || {}), ...(modification.duration || {}) },
        trigger: { ...(base.trigger || {}), ...(modification.trigger || {}) },
        traversal: { ...(base.traversal || {}), ...(modification.traversal || {}) },
        movementResistance: {
            ...(base.movementResistance || {}),
            ...(modification.movementResistance || {}),
        },
    })
}
