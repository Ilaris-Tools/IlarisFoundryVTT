const SHAPES = new Set(['cone', 'circle', 'rectangle'])

function numeric(value, fallback = 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function defaultPivot(shape) {
    if (shape === 'cone') return 'tip'
    if (shape === 'rectangle') return 'topLeft'
    return 'center'
}

export function normalizeZoneProfile(source) {
    if (!source || typeof source !== 'object') return null
    const shape = SHAPES.has(source.shape) ? source.shape : null
    if (!shape) return null

    const placement = source.placement || {}
    const lifecycle = source.lifecycle === 'persistent' ? 'persistent' : 'instant'
    const effectMode = source.effectMode === 'passive' ? 'passive' : 'triggered'
    const rawDuration = source.duration || {}
    const remaining = numeric(rawDuration.remaining ?? rawDuration.value, 0)
    const distance = numeric(source.distance)
    const angle = numeric(source.angle, 45)
    const width = numeric(source.width, 1)
    if (distance <= 0 || (shape === 'cone' && angle <= 0) || (shape === 'rectangle' && width <= 0))
        return null
    if (lifecycle === 'persistent' && remaining <= 0) return null
    if (effectMode === 'passive' && lifecycle !== 'persistent') return null

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
            triggerOnCreate: source.trigger?.triggerOnCreate !== false,
            onEnter: source.trigger?.onEnter === true,
        },
        targeting: {
            includeCaster: source.targeting?.includeCaster === true,
        },
    }
    if (lifecycle === 'persistent') {
        profile.duration = {
            type: 'sceneRounds',
            remaining,
            originalValue: numeric(rawDuration.originalValue, remaining),
        }
    }
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
    })
}
