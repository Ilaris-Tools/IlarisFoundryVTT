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
    const tokens = region.tokens?.size
        ? Array.from(region.tokens)
        : (globalThis.canvas?.tokens?.placeables || [])
              .map((token) => token.document || token)
              .filter(
                  (token) =>
                      typeof token?.testInsideRegion === 'function' &&
                      token.testInsideRegion(region),
              )
    return tokens.filter((token) => token?.id !== excludeTokenId)
}

export function resolveZoneTargets(region, options = {}) {
    return tokensToSelectedActors(getZoneTokens(region, options))
}
