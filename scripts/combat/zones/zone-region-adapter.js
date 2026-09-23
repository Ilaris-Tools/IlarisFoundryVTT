function centerOf(token) {
    const center = token?.center
    if (Number.isFinite(center?.x) && Number.isFinite(center?.y)) return center
    const document = token?.document || token
    const size = globalThis.canvas?.grid?.size || 0
    return { x: Number(document?.x || 0) + size / 2, y: Number(document?.y || 0) + size / 2 }
}

function distancePixels() {
    const dimensions = globalThis.canvas?.dimensions
    if (Number.isFinite(dimensions?.distancePixels)) return dimensions.distancePixels
    const grid = globalThis.canvas?.grid
    return Number(grid?.size || 0) / Number(grid?.distance || 1)
}

function directionBetween(origin, destination) {
    const radians = Math.atan2(destination.y - origin.y, destination.x - origin.x)
    return ((radians * 180) / Math.PI + 360) % 360
}

function tokenPosition(token) {
    const document = token?.document || token
    return {
        x: Number(token?.x ?? document?.x ?? 0),
        y: Number(token?.y ?? document?.y ?? 0),
    }
}

/**
 * Find a point just beyond the caster's rendered token shape in a direction.
 * Token#getShape returns local geometry, so the ray is evaluated in the
 * token's local coordinate space and translated back to the canvas.
 */
export function getCasterBoundaryPoint(casterToken, direction = 0) {
    const origin = centerOf(casterToken)
    const shape = casterToken?.getShape?.()
    if (!shape?.contains) return origin

    const position = tokenPosition(casterToken)
    const localOrigin = { x: origin.x - position.x, y: origin.y - position.y }
    if (!shape.contains(localOrigin.x, localOrigin.y)) return origin

    const radians = (Number(direction || 0) * Math.PI) / 180
    const vector = { x: Math.cos(radians), y: Math.sin(radians) }
    const document = casterToken?.document || casterToken
    let outside = Math.max(
        1,
        Number(casterToken?.w || 0),
        Number(casterToken?.h || 0),
        Number(casterToken?.externalRadius || 0) * 2,
        Number(document?.width || 0) * Number(globalThis.canvas?.grid?.size || 0),
        Number(document?.height || 0) * Number(globalThis.canvas?.grid?.size || 0),
    )
    let inside = 0
    while (shape.contains(localOrigin.x + vector.x * outside, localOrigin.y + vector.y * outside)) {
        inside = outside
        outside *= 2
    }
    for (let index = 0; index < 24; index += 1) {
        const midpoint = (inside + outside) / 2
        if (
            shape.contains(localOrigin.x + vector.x * midpoint, localOrigin.y + vector.y * midpoint)
        )
            inside = midpoint
        else outside = midpoint
    }
    return {
        x: origin.x + vector.x * (inside + 1),
        y: origin.y + vector.y * (inside + 1),
    }
}

function shapeFor(profile, placement) {
    const pixels = distancePixels()
    const x = Number(placement.x || 0)
    const y = Number(placement.y || 0)
    const rotation = Number(placement.direction || 0)
    if (profile.shape === 'cone') {
        return {
            type: 'cone',
            x,
            y,
            radius: Number(profile.distance || 0) * pixels,
            angle: Number(profile.angle || 0),
            rotation,
            curvature: 'round',
            gridBased: true,
        }
    }
    if (profile.shape === 'circle') {
        return {
            type: 'circle',
            x,
            y,
            radius: Number(profile.distance || 0) * pixels,
            gridBased: true,
        }
    }
    if (profile.shape === 'rectangle') {
        return {
            type: 'rectangle',
            x,
            y,
            width: Number(profile.distance || 0) * pixels,
            height: Number(profile.width || 0) * pixels,
            anchorX: 0,
            anchorY: 0,
            rotation,
            gridBased: true,
        }
    }
    throw new TypeError(`Unsupported Ilaris zone shape: ${profile.shape}`)
}

/** Build Region source data from a normalized Ilaris zone. */
export function createZoneRegionData(profile, placement, { flags = {} } = {}) {
    if (!profile || !placement) throw new TypeError('A normalized zone and placement are required.')
    return {
        name: 'Ilaris Zone',
        color: game.user.color,
        shapes: [shapeFor(profile, placement)],
        // Ilaris zones resolve containment, but this slice deliberately does
        // not restrict token movement. v14 requires a restricted Region to
        // belong to exactly one Scene Level, so do not opt into restriction
        // until a later feature supplies that level-aware movement behaviour.
        restriction: { enabled: false },
        displayMeasurements: true,
        visibility: CONST.REGION_VISIBILITY.ALWAYS,
        flags,
    }
}

/** Measure and validate a zone pivot from the caster-token centre. */
export function validateZonePlacement(
    profile,
    casterToken,
    placement,
    rangeBonus = 0,
    grid = globalThis.canvas?.grid,
) {
    if (!profile || !casterToken || !placement || !grid?.measurePath) return false
    if (profile.placement?.anchor === 'caster') return true
    const distance = grid.measurePath([centerOf(casterToken), placement], {
        gridSpaces: true,
    }).distance
    const allowedRange = Math.max(0, Number(profile.placement.range || 0) + Number(rangeBonus || 0))
    return Number(distance) <= allowedRange
}

function placementFromRegion(region) {
    const shape = region?.shapes?.[0]
    if (!shape) return null
    return { x: shape.x, y: shape.y, direction: shape.rotation || 0 }
}

/**
 * Place an ephemeral v14 Region before a cast. This deliberately uses only
 * RegionLayer#placeRegion's public API; MeasuredTemplate compatibility APIs
 * are not used anywhere in the zone workflow.
 */
export async function placeZonePreview(profile, casterToken, { rangeBonus = 0 } = {}) {
    const canvas = globalThis.canvas
    if (!canvas?.scene || !canvas?.regions || !casterToken) return null
    const casterCenter = centerOf(casterToken)
    const initialPlacement =
        profile.placement.anchor === 'caster' && profile.shape !== 'circle'
            ? getCasterBoundaryPoint(casterToken)
            : casterCenter
    const initialData = createZoneRegionData(profile, initialPlacement)

    const lockOrigin = profile.placement.anchor === 'caster'
    const region = await canvas.regions.placeRegion(initialData, {
        create: false,
        allowRotation: !lockOrigin,
        onMove: lockOrigin
            ? ({ position, shape }) => {
                  if (profile.shape === 'circle') {
                      shape.updateSource({ x: casterCenter.x, y: casterCenter.y })
                      return false
                  }
                  const direction = directionBetween(casterCenter, position)
                  const pivot = getCasterBoundaryPoint(casterToken, direction)
                  shape.updateSource({ x: pivot.x, y: pivot.y, rotation: direction })
                  return false
              }
            : undefined,
    })
    if (!region) return null

    const placement = placementFromRegion(region)
    if (!placement || !validateZonePlacement(profile, casterToken, placement, rangeBonus)) {
        ui.notifications.warn('Die Zone liegt au\u00dferhalb der zul\u00e4ssigen Reichweite.')
        return null
    }
    return { placement, regionData: region.toObject() }
}

export function getCasterToken(actor) {
    return (
        globalThis.canvas?.tokens?.placeables?.find((token) => token.actor?.id === actor?.id) ||
        null
    )
}
