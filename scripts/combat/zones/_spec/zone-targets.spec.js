import { getZoneTokens, resolveZoneTargets, tokensToSelectedActors } from '../zone-targets.js'

describe('zone Region targets', () => {
    afterEach(() => {
        delete global.canvas
    })

    test('uses the Region token collection when it is populated', () => {
        const token = {
            id: 'linked-token',
            actor: { id: 'linked-actor', name: 'Linked Actor' },
            actorLink: true,
        }
        expect(getZoneTokens({ tokens: new Set([token]) })).toEqual([token])
    })

    test('uses TokenDocument containment for an ephemeral Region', () => {
        const token = {
            id: 'unlinked-token',
            actor: { id: 'unlinked-actor', name: 'Unlinked Actor' },
            actorLink: false,
            testInsideRegion: jest.fn(() => true),
        }
        global.canvas = { tokens: { placeables: [{ document: token }] } }
        const targets = tokensToSelectedActors(getZoneTokens({ tokens: new Set() }))

        expect(token.testInsideRegion).toHaveBeenCalled()
        expect(targets).toEqual([
            {
                tokenId: 'unlinked-token',
                actorId: 'unlinked-actor',
                actorLink: false,
                name: 'Unlinked Actor',
                distance: 'Zone',
            },
        ])
    })

    test('uses current TokenDocument geometry over stale Region membership', () => {
        const staleToken = {
            id: 'stale-token',
            actor: { id: 'stale-actor', name: 'Stale Actor' },
        }
        const currentToken = {
            id: 'current-token',
            actor: { id: 'current-actor', name: 'Current Actor' },
            testInsideRegion: jest.fn(() => true),
        }
        global.canvas = { tokens: { placeables: [{ document: currentToken }] } }

        expect(getZoneTokens({ tokens: new Set([staleToken]) })).toEqual([currentToken])
        expect(currentToken.testInsideRegion).toHaveBeenCalled()
    })

    test('includes only the token whose current geometry is contained', () => {
        const insideToken = {
            id: 'inside-token',
            actor: { id: 'inside-actor', name: 'Inside Actor' },
            actorLink: false,
            testInsideRegion: jest.fn(() => true),
        }
        const outsideToken = {
            id: 'outside-token',
            actor: { id: 'outside-actor', name: 'Outside Actor' },
            actorLink: false,
            testInsideRegion: jest.fn(() => false),
        }
        global.canvas = {
            tokens: { placeables: [{ document: insideToken }, { document: outsideToken }] },
        }

        expect(resolveZoneTargets({ tokens: new Set() })).toEqual([
            {
                tokenId: 'inside-token',
                actorId: 'inside-actor',
                actorLink: false,
                name: 'Inside Actor',
                distance: 'Zone',
            },
        ])
        expect(insideToken.testInsideRegion).toHaveBeenCalled()
        expect(outsideToken.testInsideRegion).toHaveBeenCalled()
    })

    test('keeps a non-active Scene on its own Region token collection', () => {
        const regionToken = {
            id: 'other-scene-token',
            actor: { id: 'other-scene-actor', name: 'Other Scene Actor' },
        }
        const activeSceneToken = {
            id: 'active-scene-token',
            actor: { id: 'active-scene-actor', name: 'Active Scene Actor' },
            testInsideRegion: jest.fn(() => true),
        }
        global.canvas = {
            scene: { id: 'active-scene' },
            tokens: { placeables: [{ document: activeSceneToken }] },
        }

        expect(
            getZoneTokens({
                parent: { id: 'other-scene' },
                tokens: new Set([regionToken]),
            }),
        ).toEqual([regionToken])
        expect(activeSceneToken.testInsideRegion).not.toHaveBeenCalled()
    })

    test('excludes only the source token when caster targeting is disabled', () => {
        const region = {
            tokens: new Set([
                { id: 'caster-token', actor: { id: 'actor-a', name: 'Caster' }, actorLink: true },
                {
                    id: 'other-token',
                    actor: { id: 'actor-a', name: 'Caster duplicate' },
                    actorLink: true,
                },
            ]),
        }

        expect(resolveZoneTargets(region, { excludeTokenId: 'caster-token' })).toEqual([
            {
                tokenId: 'other-token',
                actorId: 'actor-a',
                actorLink: true,
                name: 'Caster duplicate',
                distance: 'Zone',
            },
        ])
    })
})
