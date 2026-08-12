import { getZoneTokens, resolveZoneTargets, tokensToSelectedActors } from '../zone-targets.js'

describe('zone Region targets', () => {
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
