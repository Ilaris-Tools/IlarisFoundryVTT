import {
    isPassiveZoneEffect,
    isZoneTraversalMarker,
    removePassiveZoneEffects,
    removeZoneTraversalMarkers,
    upsertZoneTraversalMarker,
} from '../zone-effect-ownership.js'

describe('passive Zone effect ownership', () => {
    const ownership = {
        regionId: 'region-a',
        applicationId: 'cast-a:token-a',
        tokenId: 'token-a',
        spellUuid: 'Item.spell',
        preEffectIndex: 0,
    }

    test('matches the complete passive Zone identity only', () => {
        expect(
            isPassiveZoneEffect(
                {
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'region-a',
                            zoneApplicationId: 'cast-a:token-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.spell',
                            preEffectIndex: 0,
                        },
                    },
                },
                ownership,
            ),
        ).toBe(true)
        expect(
            isPassiveZoneEffect(
                {
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'region-b',
                            zoneApplicationId: 'cast-a:token-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.spell',
                            preEffectIndex: 0,
                        },
                    },
                },
                ownership,
            ),
        ).toBe(false)
    })

    test('deletes only effects belonging to the requested Zone application', async () => {
        const actor = {
            effects: [
                {
                    id: 'owned',
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'region-a',
                            zoneApplicationId: 'cast-a:token-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.spell',
                            preEffectIndex: 0,
                        },
                    },
                },
                {
                    id: 'other-zone',
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'region-b',
                            zoneApplicationId: 'cast-b:token-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.spell',
                            preEffectIndex: 0,
                        },
                    },
                },
                {
                    id: 'manual',
                    flags: { ilaris: { sourceType: 'uebernatuerlich', spellUuid: 'Item.spell' } },
                },
            ],
            deleteEmbeddedDocuments: jest.fn(),
        }

        await removePassiveZoneEffects(actor, ownership)

        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['owned'])
    })

    test('coalesces concurrent cleanup requests for one passive Zone application', async () => {
        let resolveDeletion
        const actor = {
            id: 'actor-a',
            effects: [
                {
                    id: 'owned',
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'region-a',
                            zoneApplicationId: 'cast-a:token-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.spell',
                            preEffectIndex: 0,
                        },
                    },
                },
            ],
            deleteEmbeddedDocuments: jest.fn(
                () =>
                    new Promise((resolve) => {
                        resolveDeletion = resolve
                    }),
            ),
        }

        const first = removePassiveZoneEffects(actor, ownership)
        const second = removePassiveZoneEffects(actor, ownership)

        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledTimes(1)
        resolveDeletion([])
        await expect(Promise.all([first, second])).resolves.toEqual([['owned'], ['owned']])
    })

    test('removes only the matching source from a shared status condition', async () => {
        const condition = {
            id: 'prone',
            system: {
                ilarisCondition: {
                    statusId: 'Position4',
                    sources: [
                        { id: 'owned-source', passiveZone: ownership },
                        {
                            id: 'other-source',
                            passiveZone: { ...ownership, regionId: 'region-b' },
                        },
                    ],
                },
            },
            update: jest.fn(),
        }
        const actor = { effects: [condition], deleteEmbeddedDocuments: jest.fn() }

        await removePassiveZoneEffects(actor, ownership)

        expect(condition.update).toHaveBeenCalledWith({
            'system.ilarisCondition.sources': [expect.objectContaining({ id: 'other-source' })],
        })
        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()
    })
})

describe('Zone traversal marker ownership', () => {
    const ownership = {
        regionId: 'wall-a',
        applicationId: 'cast-a',
        tokenId: 'token-a',
        spellUuid: 'Item.wand',
    }

    test('matches only the marker owned by the requested wall and Token', () => {
        expect(
            isZoneTraversalMarker(
                {
                    flags: {
                        ilaris: {
                            zoneTraversalMarker: true,
                            zoneRegionId: 'wall-a',
                            zoneApplicationId: 'cast-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.wand',
                        },
                    },
                },
                ownership,
            ),
        ).toBe(true)
        expect(
            isZoneTraversalMarker(
                {
                    flags: {
                        ilaris: {
                            zoneTraversalMarker: true,
                            zoneRegionId: 'wall-b',
                            zoneApplicationId: 'cast-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.wand',
                        },
                    },
                },
                ownership,
            ),
        ).toBe(false)
    })

    test('creates one neutral marker and does not duplicate it', async () => {
        const actor = {
            effects: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }
        await upsertZoneTraversalMarker(actor, ownership, {
            name: 'Wand aus Dornen – Durchquerung fehlgeschlagen',
            origin: 'Actor.caster',
        })
        expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            expect.objectContaining({
                name: 'Wand aus Dornen – Durchquerung fehlgeschlagen',
                origin: 'Actor.caster',
                changes: [],
                flags: { ilaris: expect.objectContaining({ zoneTraversalMarker: true }) },
            }),
        ])
        actor.effects.push({
            id: 'marker',
            flags: {
                ilaris: {
                    zoneTraversalMarker: true,
                    zoneRegionId: 'wall-a',
                    zoneApplicationId: 'cast-a',
                    targetTokenId: 'token-a',
                    spellUuid: 'Item.wand',
                },
            },
        })
        await upsertZoneTraversalMarker(actor, ownership)
        expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
    })

    test('coalesces simultaneous requests for the same traversal marker', async () => {
        const actor = {
            id: 'actor-a',
            effects: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }

        await Promise.all([
            upsertZoneTraversalMarker(actor, ownership),
            upsertZoneTraversalMarker(actor, ownership),
        ])

        expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
    })

    test('deletes only matching traversal markers', async () => {
        const actor = {
            effects: [
                {
                    id: 'owned',
                    flags: {
                        ilaris: {
                            zoneTraversalMarker: true,
                            zoneRegionId: 'wall-a',
                            zoneApplicationId: 'cast-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.wand',
                        },
                    },
                },
                {
                    id: 'other',
                    flags: {
                        ilaris: {
                            zoneTraversalMarker: true,
                            zoneRegionId: 'wall-b',
                            zoneApplicationId: 'cast-b',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.wand',
                        },
                    },
                },
            ],
            deleteEmbeddedDocuments: jest.fn(),
        }
        await removeZoneTraversalMarkers(actor, ownership)
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['owned'])
    })
})
