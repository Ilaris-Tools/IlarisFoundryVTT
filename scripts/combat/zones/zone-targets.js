/** Convert Foundry token placeables to the existing token-safe target format. */
export function tokensToSelectedActors(tokens = []) {
    return tokens
        .filter((token) => token?.actor)
        .map((token) => ({
            tokenId: token.id,
            actorId: token.actor.id,
            actorLink: token.document?.actorLink ?? token.actorLink ?? true,
            name: token.actor.name || token.name,
            distance: 'Zone',
        }))
}

/** Use Foundry v14 Region containment rather than reimplementing geometry. */
export function getZoneTokens(region, { excludeTokenId = '' } = {}) {
    if (!region) return []
    const canvasTokens = globalThis.canvas?.tokens?.placeables || []
    const hasActiveSceneGeometry =
        canvasTokens.length &&
        (!region.parent || globalThis.canvas?.scene?.id === region.parent?.id)
    // RegionDocument#tokens is updated through embedded-document lifecycle
    // events. During a live combat turn it can still describe the preceding
    // token position, so prefer Foundry's current TokenDocument geometry when
    // the rendered Scene is available.
    const tokens = hasActiveSceneGeometry
        ? canvasTokens
              .map((token) => token.document || token)
              .filter(
                  (token) =>
                      typeof token?.testInsideRegion === 'function' &&
                      token.testInsideRegion(region),
              )
        : Array.from(region.tokens || [])
    return tokens.filter((token) => token?.id !== excludeTokenId)
}

export function resolveZoneTargets(region, options = {}) {
    return tokensToSelectedActors(getZoneTokens(region, options))
}
