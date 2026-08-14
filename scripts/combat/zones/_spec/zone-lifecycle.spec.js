import {
    classifyZoneMembership,
    classifyZoneTraversalMovement,
    createPersistentZone,
    createZoneDraftRegion,
    deleteZoneDraftRegion,
    cleanupPassiveZoneEffects,
    cleanupZoneTraversalMarkers,
    dispatchPersistentZoneTraversal,
    dispatchPersistentZoneRoundStart,
    dispatchPersistentZoneTurnStart,
    reducePersistentZoneDurations,
    reconcilePersistentPassiveZones,
    reconcileZoneAdministration,
    resolveZoneTraversalResistance,
    updatePersistentZoneMembership,
} from '../zone-lifecycle.js'

describe('persistent zone duration', () => {
    beforeEach(() => {
        global.game = {
            user: { id: 'gm' },
            users: [{ id: 'gm', active: true, isGM: true }],
        }
        global.foundry ??= {}
        global.foundry.utils ??= {}
        global.foundry.utils.deepClone = jest.fn((value) => JSON.parse(JSON.stringify(value)))
        global.foundry.utils.randomID = jest.fn(() => 'zone-application-id')
        global.foundry.utils.fromUuid = jest.fn()
        global.ChatMessage = { getSpeaker: jest.fn(() => ({ alias: 'Caster' })) }
        global.game.actors = { get: jest.fn(), values: jest.fn(() => []) }
        global.canvas = { tokens: { get: jest.fn(() => null) } }
    })

    test('classifies only one normal ENTER movement through a Region', () => {
        global.CONST = { REGION_MOVEMENT_SEGMENTS: { ENTER: 1, MOVE: 2, EXIT: 3 } }
        const region = { id: 'wall-region' }
        const token = {
            id: 'target-token',
            segmentizeRegionMovementPath: jest.fn(() => [
                { type: 1, action: 'walk' },
                { type: 2, action: 'walk' },
                { type: 3, action: 'walk' },
            ]),
        }
        const movement = {
            id: 'movement-1',
            origin: { x: 0, y: 0 },
            passed: { waypoints: [{ x: 100, y: 0, action: 'walk' }] },
        }

        expect(classifyZoneTraversalMovement(region, token, movement)).toEqual({
            window: 'wall-region:target-token:movement-1',
        })
        expect(token.segmentizeRegionMovementPath).toHaveBeenCalledWith(region, [
            movement.origin,
            ...movement.passed.waypoints,
        ])
    })

    test('administrative reconciliation updates triggered-zone membership without dispatching', async () => {
        const actor = { id: 'target-actor', name: 'Target' }
        const token = { id: 'target-token', actor, actorLink: true }
        const zone = {
            applicationId: 'cast-a',
            spellUuid: 'Item.spell',
            profile: {
                lifecycle: 'persistent',
                effectMode: 'triggered',
                trigger: { onEnter: true },
            },
            durationType: 'sceneRounds',
            membership: ['stale-token'],
        }
        const region = {
            id: 'region-a',
            flags: { Ilaris: { zone } },
            tokens: new Set([token]),
            update: jest.fn(),
        }
        const scene = { regions: [region] }
        global.ChatMessage.create = jest.fn()

        await reconcileZoneAdministration(scene)

        expect(region.update).toHaveBeenCalledWith({
            'flags.Ilaris.zone.membership': ['target-token'],
        })
        expect(global.ChatMessage.create).not.toHaveBeenCalled()
    })

    test('classifies a normal EXIT movement through a Region', () => {
        global.CONST = { REGION_MOVEMENT_SEGMENTS: { ENTER: 1, MOVE: 2, EXIT: 3 } }
        const region = { id: 'wall-region' }
        const token = {
            id: 'target-token',
            segmentizeRegionMovementPath: jest.fn(() => [{ type: 3, action: 'walk' }]),
        }
        const movement = {
            id: 'movement-exit',
            origin: { x: 100, y: 0 },
            passed: { waypoints: [{ x: 0, y: 0, action: 'walk' }] },
        }

        expect(classifyZoneTraversalMovement(region, token, movement)).toEqual({
            window: 'wall-region:target-token:movement-exit',
        })
    })

    test('rejects internal, initial, and teleport movement paths', () => {
        global.CONST = {
            REGION_MOVEMENT_SEGMENTS: { ENTER: 1, MOVE: 2, EXIT: 3 },
            TOKEN_MOVEMENT_ACTIONS: { teleport: { teleport: true } },
        }
        const region = { id: 'wall-region' }
        const token = {
            id: 'target-token',
            segmentizeRegionMovementPath: jest.fn(() => [{ type: 2, action: 'walk' }]),
        }
        const movement = {
            id: 'movement-1',
            origin: { x: 0, y: 0 },
            passed: { waypoints: [{ x: 100, y: 0, action: 'walk' }] },
        }

        expect(classifyZoneTraversalMovement(region, token, movement)).toBeNull()
        token.segmentizeRegionMovementPath.mockReturnValue([{ type: 1, action: 'teleport' }])
        expect(classifyZoneTraversalMovement(region, token, movement)).toBeNull()
        expect(classifyZoneTraversalMovement(region, token, null)).toBeNull()
    })

    test('dispatches one traversal resistance for an entered wall without generic entry dispatch', async () => {
        global.CONST = {
            REGION_MOVEMENT_SEGMENTS: { ENTER: 1, MOVE: 2, EXIT: 3 },
            DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 },
        }
        global.ChatMessage.create = jest.fn().mockResolvedValue(undefined)
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
            segmentizeRegionMovementPath: jest.fn(() => [{ type: 1, action: 'walk' }]),
        }
        const zone = {
            applicationId: 'cast-a',
            spellUuid: 'Item.wand',
            casterUuid: 'Actor.caster',
            profile: {
                shape: 'rectangle',
                lifecycle: 'persistent',
                effectMode: 'triggered',
                trigger: { onTraverse: true, onEnter: false },
                traversal: { avoidTest: { enabled: true, attribut: 'GE', resistDifficulty: 16 } },
            },
            preEffects: [],
        }
        const scene = { id: 'scene-a', regions: [] }
        const region = { id: 'wall-region', parent: scene, flags: { Ilaris: { zone } } }
        scene.regions = [region]
        target.parent = scene
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === 'Item.wand') return { uuid, name: 'Wand aus Dornen' }
            if (uuid === 'Actor.caster') return { uuid, id: 'caster', name: 'Caster' }
            return null
        })
        const movement = {
            id: 'movement-1',
            origin: { x: 0, y: 0 },
            passed: { waypoints: [{ x: 100, y: 0, action: 'walk' }] },
        }

        await Promise.all([
            dispatchPersistentZoneTraversal(target, movement),
            dispatchPersistentZoneTraversal(target, movement),
        ])

        expect(global.ChatMessage.create).toHaveBeenCalledTimes(1)
        expect(global.ChatMessage.create.mock.calls[0][0].content).toContain(
            'Widerstand leisten (GE)',
        )
    })

    test('dispatches the existing traversal resistance flow for an outbound wall movement', async () => {
        global.CONST = {
            REGION_MOVEMENT_SEGMENTS: { ENTER: 1, MOVE: 2, EXIT: 3 },
            DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 },
        }
        global.ChatMessage.create = jest.fn().mockResolvedValue(undefined)
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
            segmentizeRegionMovementPath: jest.fn(() => [{ type: 3, action: 'walk' }]),
        }
        const zone = {
            applicationId: 'cast-a',
            spellUuid: 'Item.wand',
            casterUuid: 'Actor.caster',
            profile: {
                shape: 'rectangle',
                lifecycle: 'persistent',
                effectMode: 'triggered',
                trigger: { onTraverse: true, onEnter: false },
                traversal: { avoidTest: { enabled: true, attribut: 'GE', resistDifficulty: 16 } },
            },
            preEffects: [],
        }
        const scene = { id: 'scene-a', regions: [] }
        const region = { id: 'wall-region', parent: scene, flags: { Ilaris: { zone } } }
        scene.regions = [region]
        target.parent = scene
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === 'Item.wand') return { uuid, name: 'Wand aus Dornen' }
            if (uuid === 'Actor.caster') return { uuid, id: 'caster', name: 'Caster' }
            return null
        })

        await dispatchPersistentZoneTraversal(target, {
            id: 'movement-exit',
            origin: { x: 100, y: 0 },
            passed: { waypoints: [{ x: 0, y: 0, action: 'walk' }] },
        })

        expect(global.ChatMessage.create).toHaveBeenCalledTimes(1)
        expect(global.ChatMessage.create.mock.calls[0][0].content).toContain(
            'Widerstand leisten (GE)',
        )
    })

    test('routes an owned player traversal to the active GM without dispatching locally', async () => {
        global.CONST = { REGION_MOVEMENT_SEGMENTS: { ENTER: 1, MOVE: 2, EXIT: 3 } }
        global.game.user = { id: 'player', isGM: false }
        global.game.socket = { emit: jest.fn() }
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            segmentizeRegionMovementPath: jest.fn(() => [{ type: 1, action: 'walk' }]),
        }
        const zone = {
            profile: {
                shape: 'rectangle',
                lifecycle: 'persistent',
                effectMode: 'triggered',
                trigger: { onTraverse: true },
            },
        }
        const scene = {
            id: 'scene-a',
            regions: [{ id: 'wall-region', flags: { Ilaris: { zone } } }],
        }
        target.parent = scene
        const movement = {
            id: 'movement-1',
            origin: { x: 0, y: 0 },
            passed: { waypoints: [{ x: 100, y: 0, action: 'walk', ignored: true }] },
        }

        await dispatchPersistentZoneTraversal(target, movement)

        expect(global.game.socket.emit).toHaveBeenCalledWith('system.Ilaris', {
            type: 'dispatchZoneTraversal',
            data: {
                sceneId: 'scene-a',
                tokenId: 'target-token',
                userId: 'player',
                movement: {
                    id: 'movement-1',
                    origin: { x: 0, y: 0 },
                    passed: { waypoints: [{ x: 100, y: 0, action: 'walk' }] },
                },
            },
        })
    })

    test('creates a failure marker and removes only it after a successful traversal', async () => {
        global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } }
        global.ChatMessage.create = jest.fn().mockResolvedValue(undefined)
        const actor = {
            id: 'target-actor',
            name: 'Target',
            effects: [],
            createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                actor.effects.push({ id: 'marker-a', ...data })
                return [actor.effects.at(-1)]
            }),
            deleteEmbeddedDocuments: jest.fn(async (_type, ids) => {
                actor.effects = actor.effects.filter((effect) => !ids.includes(effect.id))
            }),
        }
        const zone = { applicationId: 'cast-a', spellUuid: 'Item.wand' }
        const region = { id: 'wall-a', flags: { Ilaris: { zone } } }
        global.game.scenes = { get: jest.fn(() => ({ regions: new Map([[region.id, region]]) })) }
        const traversal = {
            sceneId: 'scene-a',
            regionId: 'wall-a',
            tokenId: 'token-a',
            applicationId: 'cast-a',
            spellUuid: 'Item.wand',
            spellName: 'Wand aus Dornen',
            casterUuid: 'Actor.caster',
        }

        await resolveZoneTraversalResistance(actor, traversal, false)
        expect(actor.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
        expect(global.ChatMessage.create).toHaveBeenCalledTimes(1)

        await resolveZoneTraversalResistance(actor, traversal, true)
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['marker-a'])
    })

    test('removes only traversal markers owned by an expired or deleted wall Region', async () => {
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
        global.game.actors = { values: jest.fn(() => [actor]) }
        const region = {
            id: 'wall-a',
            flags: {
                Ilaris: {
                    zone: {
                        applicationId: 'cast-a',
                        spellUuid: 'Item.wand',
                        profile: {
                            shape: 'rectangle',
                            lifecycle: 'persistent',
                            effectMode: 'triggered',
                            trigger: { onTraverse: true },
                        },
                    },
                },
            },
        }

        await cleanupZoneTraversalMarkers(region)

        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['owned'])
    })

    test('decrements every scene-round zone once and deletes expired zones', async () => {
        const active = {
            flags: {
                Ilaris: {
                    zone: { profile: { duration: { type: 'sceneRounds' } }, remaining: 2 },
                },
            },
            update: jest.fn(),
            setFlag: jest.fn(),
            delete: jest.fn(),
        }
        const expired = {
            flags: {
                Ilaris: {
                    zone: { profile: { duration: { type: 'sceneRounds' } }, remaining: 1 },
                },
            },
            update: jest.fn(),
            setFlag: jest.fn(),
            delete: jest.fn(),
        }
        await reducePersistentZoneDurations({ scene: { regions: [active, expired] } })

        expect(active.update).toHaveBeenCalledWith({ 'flags.Ilaris.zone.remaining': 1 })
        expect(expired.delete).toHaveBeenCalledTimes(1)
    })

    test('does not age zones while a combat is rewound', async () => {
        const region = {
            flags: {
                Ilaris: {
                    zone: { profile: { duration: { type: 'sceneRounds' } }, remaining: 2 },
                },
            },
            update: jest.fn(),
            setFlag: jest.fn(),
            delete: jest.fn(),
        }
        await reducePersistentZoneDurations({ scene: { regions: [region] } }, { direction: -1 })
        expect(region.update).not.toHaveBeenCalled()
        expect(region.delete).not.toHaveBeenCalled()
    })

    test('dispatches all current targets once per forward combat round and claims empty windows', async () => {
        const first = {
            id: 'first-token',
            actor: { id: 'first-actor', name: 'First', isToken: true },
            actorLink: false,
        }
        const second = {
            id: 'second-token',
            actor: { id: 'second-actor', name: 'Second', isToken: true },
            actorLink: false,
        }
        const zone = {
            applicationId: 'zone-application-id',
            spellUuid: 'Item.periodic',
            casterUuid: 'Actor.caster',
            casterTokenId: 'caster-token',
            profile: {
                effectMode: 'triggered',
                targeting: { includeCaster: false },
                trigger: { onRoundStart: true },
            },
            preEffects: [],
        }
        const region = {
            id: 'periodic-region',
            flags: { Ilaris: { zone } },
            tokens: new Set([first, second]),
            update: jest.fn(async (change) => {
                zone.lastRoundStartWindow = change['flags.Ilaris.zone.lastRoundStartWindow']
            }),
        }
        const combat = { id: 'combat-a', scene: { id: 'scene-a', regions: [region] } }
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === zone.spellUuid) return { uuid, name: 'Periodic spell' }
            if (uuid === zone.casterUuid) return { uuid, id: 'caster', name: 'Caster' }
            return null
        })

        await Promise.all([
            dispatchPersistentZoneRoundStart(combat, { round: 1, turn: 0 }, { direction: 1 }),
            dispatchPersistentZoneRoundStart(combat, { round: 1, turn: 0 }, { direction: 1 }),
        ])
        region.tokens = new Set()
        await dispatchPersistentZoneRoundStart(combat, { round: 2, turn: 0 }, { direction: 1 })

        expect(region.update).toHaveBeenCalledTimes(2)
        expect(region.update).toHaveBeenNthCalledWith(1, {
            'flags.Ilaris.zone.lastRoundStartWindow': 'combat-a:1:periodic-region',
        })
        expect(region.update).toHaveBeenNthCalledWith(2, {
            'flags.Ilaris.zone.lastRoundStartWindow': 'combat-a:2:periodic-region',
        })
        // One pipeline call hydrates the spell/caster for all occupants together.
        expect(global.foundry.utils.fromUuid).toHaveBeenCalledTimes(2)
    })

    test('skips passive and rewound periodic Zones and runs a final periodic tick before expiry', async () => {
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
        }
        const triggeredZone = {
            applicationId: 'zone-application-id',
            spellUuid: 'Item.periodic',
            casterUuid: 'Actor.caster',
            profile: {
                effectMode: 'triggered',
                duration: { type: 'sceneRounds' },
                targeting: { includeCaster: false },
                trigger: { onRoundStart: true },
            },
            remaining: 1,
            preEffects: [],
        }
        const triggered = {
            id: 'triggered-region',
            flags: { Ilaris: { zone: triggeredZone } },
            tokens: new Set([target]),
            update: jest.fn(async (change) => {
                triggeredZone.lastRoundStartWindow =
                    change['flags.Ilaris.zone.lastRoundStartWindow']
            }),
            delete: jest.fn(),
        }
        const passive = {
            id: 'passive-region',
            flags: {
                Ilaris: {
                    zone: {
                        ...triggeredZone,
                        profile: { ...triggeredZone.profile, effectMode: 'passive' },
                    },
                },
            },
            tokens: new Set([target]),
            update: jest.fn(),
            delete: jest.fn(),
        }
        const combat = { id: 'combat-a', scene: { id: 'scene-a', regions: [triggered, passive] } }
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === triggeredZone.spellUuid) return { uuid, name: 'Periodic spell' }
            if (uuid === triggeredZone.casterUuid) return { uuid, id: 'caster', name: 'Caster' }
            return null
        })

        await dispatchPersistentZoneRoundStart(combat, { round: 1, turn: 0 }, { direction: -1 })
        expect(triggered.update).not.toHaveBeenCalled()
        expect(passive.update).not.toHaveBeenCalled()

        await dispatchPersistentZoneRoundStart(combat, { round: 1, turn: 0 }, { direction: 1 })
        await reducePersistentZoneDurations(combat, { direction: 1 })
        expect(triggered.update).toHaveBeenCalledWith({
            'flags.Ilaris.zone.lastRoundStartWindow': 'combat-a:1:triggered-region',
        })
        expect(triggered.delete).toHaveBeenCalledTimes(1)
        expect(passive.update).not.toHaveBeenCalled()
    })

    test('dispatches one turn-start trigger for the destination Token and retries only next turn', async () => {
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
        }
        const zone = {
            applicationId: 'zone-application-id',
            spellUuid: 'Item.wand-aus-dornen',
            casterUuid: 'Actor.caster',
            casterTokenId: 'caster-token',
            profile: {
                effectMode: 'triggered',
                targeting: { includeCaster: false },
                trigger: { onTurnStart: true },
            },
            preEffects: [],
        }
        const region = {
            id: 'persistent-region',
            flags: { Ilaris: { zone } },
            tokens: new Set([target]),
            update: jest.fn(async (change) => {
                zone.lastTurnStartWindow = change['flags.Ilaris.zone.lastTurnStartWindow']
            }),
        }
        const scene = { id: 'scene-a', regions: [region], tokens: new Map([[target.id, target]]) }
        const combat = {
            id: 'combat-a',
            scene,
            turns: [{ _id: 'combatant-a', tokenId: target.id }],
        }
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === zone.spellUuid) return { uuid, name: 'Wand aus Dornen' }
            if (uuid === zone.casterUuid) return { uuid, id: 'caster', name: 'Caster' }
            return null
        })

        await Promise.all([
            dispatchPersistentZoneTurnStart(combat, { round: 1, turn: 0 }, { direction: 1 }),
            dispatchPersistentZoneTurnStart(combat, { round: 1, turn: 0 }, { direction: 1 }),
        ])
        await dispatchPersistentZoneTurnStart(combat, { round: 2, turn: 0 }, { direction: 1 })

        expect(region.update).toHaveBeenCalledTimes(2)
        expect(region.update).toHaveBeenNthCalledWith(1, {
            'flags.Ilaris.zone.lastTurnStartWindow': 'combat-a:1:0:persistent-region:target-token',
        })
        expect(region.update).toHaveBeenNthCalledWith(2, {
            'flags.Ilaris.zone.lastTurnStartWindow': 'combat-a:2:0:persistent-region:target-token',
        })
        expect(global.foundry.utils.fromUuid).toHaveBeenCalledTimes(4)
    })

    test('does not dispatch a turn-start trigger for a departed Token, a passive Zone, or a rewind', async () => {
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
        }
        const makeRegion = (id, effectMode = 'triggered') => ({
            id,
            flags: {
                Ilaris: {
                    zone: {
                        applicationId: 'zone-application-id',
                        spellUuid: 'Item.wand-aus-dornen',
                        casterUuid: 'Actor.caster',
                        profile: {
                            effectMode,
                            targeting: { includeCaster: false },
                            trigger: { onTurnStart: true },
                        },
                        preEffects: [],
                    },
                },
            },
            tokens: new Set(),
            update: jest.fn(),
        })
        const departed = makeRegion('departed')
        const passive = makeRegion('passive', 'passive')
        const scene = {
            id: 'scene-a',
            regions: [departed, passive],
            tokens: new Map([[target.id, target]]),
        }
        const combat = { id: 'combat-a', scene, turns: [{ tokenId: target.id }] }

        await dispatchPersistentZoneTurnStart(combat, { round: 1, turn: 0 }, { direction: 1 })
        await dispatchPersistentZoneTurnStart(combat, { round: 1, turn: 0 }, { direction: -1 })

        expect(departed.update).not.toHaveBeenCalled()
        expect(passive.update).not.toHaveBeenCalled()
        expect(global.foundry.utils.fromUuid).not.toHaveBeenCalled()
    })

    test('does not backfill a turn-start trigger when a Zone is created during the current turn', async () => {
        const occupant = {
            id: 'target-token',
            actor: { id: 'token-actor', name: 'Unlinked Target', isToken: true },
            actorLink: false,
        }
        const region = { id: 'persistent-region', tokens: new Set([occupant]), update: jest.fn() }
        let persistedState
        const scene = {
            createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                persistedState = data.flags.Ilaris.zone
                region.flags = { Ilaris: { zone: persistedState } }
                return [region]
            }),
        }
        const zone = {
            lifecycle: 'persistent',
            duration: { type: 'sceneRounds', remaining: 3, originalValue: 3 },
            targeting: { includeCaster: false },
            trigger: { triggerOnCreate: false, onEnter: false, onTurnStart: true },
        }

        await createPersistentZone({
            scene,
            regionData: { name: 'Turn-start Zone', shapes: [] },
            dialog: {
                item: { uuid: 'Item.turn-start' },
                actor: { uuid: 'Actor.caster' },
                zoneCasterTokenId: 'caster-token',
                armedInputValues: {},
                maneuverDurationBonus: 0,
                maechtigeMagieQs: 0,
                getSelectedSpellModificationId: () => '',
            },
            zone,
            preEffects: [],
        })

        expect(persistedState.lastTurnStartWindow).toBeUndefined()
        expect(region.update).toHaveBeenCalledWith({
            'flags.Ilaris.zone.membership': ['target-token'],
            'flags.Ilaris.zone.initializing': false,
        })
        expect(global.foundry.utils.fromUuid).not.toHaveBeenCalled()
    })

    test('only marks new and re-entering tokens as entries', () => {
        const firstEntry = classifyZoneMembership([], [{ tokenId: 'a' }])
        const repeatedUpdate = classifyZoneMembership(firstEntry.membership, [{ tokenId: 'a' }])
        const leftZone = classifyZoneMembership(firstEntry.membership, [])
        const reentry = classifyZoneMembership(leftZone.membership, [{ tokenId: 'a' }])

        expect(firstEntry.entered).toEqual([{ tokenId: 'a' }])
        expect(repeatedUpdate.entered).toEqual([])
        expect(reentry.entered).toEqual([{ tokenId: 'a' }])
    })

    test('serializes canonical persistent-zone state and records initial occupants', async () => {
        const occupant = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
        }
        const region = { id: 'persistent-region', tokens: new Set([occupant]), update: jest.fn() }
        let persistedRegionData
        const scene = {
            createEmbeddedDocuments: jest.fn(async (_type, documents) => {
                persistedRegionData = structuredClone(documents[0])
                return [region]
            }),
        }
        const zone = {
            lifecycle: 'persistent',
            duration: { type: 'sceneRounds', remaining: 3, originalValue: 3 },
            targeting: { includeCaster: false },
            trigger: { triggerOnCreate: false, onEnter: true },
        }
        const dialog = {
            item: { uuid: 'Item.wand-aus-dornen' },
            actor: { uuid: 'Actor.caster' },
            zoneCasterTokenId: 'caster-token',
            armedInputValues: { wall: 1 },
            maneuverDurationBonus: 2,
            maechtigeMagieQs: 1,
            getSelectedSpellModificationId: () => 'wall-form',
        }

        const created = await createPersistentZone({
            scene,
            regionData: { name: 'Wand aus Dornen', shapes: [] },
            dialog,
            zone,
            preEffects: [{ name: 'Dornen' }],
        })

        expect(created).toBe(region)
        expect(persistedRegionData).toEqual(
            expect.objectContaining({
                flags: {
                    Ilaris: {
                        zone: expect.objectContaining({
                            applicationId: 'zone-application-id',
                            spellUuid: 'Item.wand-aus-dornen',
                            casterUuid: 'Actor.caster',
                            casterTokenId: 'caster-token',
                            spellModificationId: 'wall-form',
                            durationType: 'sceneRounds',
                            remaining: 3,
                            originalValue: 3,
                            membership: [],
                        }),
                    },
                },
            }),
        )
        expect(region.update).toHaveBeenCalledWith({
            'flags.Ilaris.zone.membership': ['target-token'],
            'flags.Ilaris.zone.initializing': false,
        })
    })

    test('snapshots a caster-attribute duration before persisting a Region and rejects invalid values', async () => {
        const region = { id: 'persistent-region', tokens: new Set(), update: jest.fn() }
        let persistedRegionData
        const scene = {
            createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                persistedRegionData = structuredClone(data)
                return [region]
            }),
        }
        const dialog = {
            item: { uuid: 'Item.aeolitus' },
            actor: { uuid: 'Actor.caster', system: { attribute: { KO: { wert: 5 } } } },
            getSelectedSpellModificationId: () => 'langer-atem',
        }
        const zone = {
            lifecycle: 'persistent',
            duration: { source: 'casterAttribute', attribute: 'KO', remaining: 0 },
            trigger: { triggerOnCreate: false },
        }

        await createPersistentZone({
            scene,
            regionData: { name: 'Langer Atem', shapes: [] },
            dialog,
            zone,
            preEffects: [],
        })

        expect(persistedRegionData.flags.Ilaris.zone).toMatchObject({
            remaining: 5,
            originalValue: 5,
            profile: { duration: { type: 'sceneRounds', remaining: 5, originalValue: 5 } },
        })
        expect(persistedRegionData.flags.Ilaris.zone.profile.duration).not.toHaveProperty('source')

        await createPersistentZone({
            scene,
            regionData: { name: 'Ungültig', shapes: [] },
            dialog: {
                ...dialog,
                actor: { uuid: 'Actor.caster', system: { attribute: { KO: {} } } },
            },
            zone,
            preEffects: [],
        })
        expect(scene.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
    })

    test('processes entry once, then again only after a token has left the Region', async () => {
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
        }
        const zone = {
            applicationId: 'zone-application-id',
            spellUuid: 'Item.wand-aus-dornen',
            casterUuid: 'Actor.caster',
            casterTokenId: 'caster-token',
            profile: { targeting: { includeCaster: false }, trigger: { onEnter: true } },
            preEffects: [],
            membership: [],
        }
        const region = {
            id: 'persistent-region',
            flags: { Ilaris: { zone } },
            tokens: new Set([target]),
            update: jest.fn().mockImplementation(async (change) => {
                if (change['flags.Ilaris.zone.membership'])
                    zone.membership = change['flags.Ilaris.zone.membership']
            }),
        }
        const scene = { regions: [region] }
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === zone.spellUuid) return { uuid, name: 'Wand aus Dornen' }
            if (uuid === zone.casterUuid) return { uuid, name: 'Caster' }
            return null
        })

        await updatePersistentZoneMembership(scene)
        await updatePersistentZoneMembership(scene)
        expect(region.update).toHaveBeenCalledTimes(1)
        expect(region.update).toHaveBeenLastCalledWith({
            'flags.Ilaris.zone.membership': ['target-token'],
        })

        region.tokens = new Set()
        await updatePersistentZoneMembership(scene)
        region.tokens = new Set([target])
        await updatePersistentZoneMembership(scene)

        expect(region.update).toHaveBeenCalledTimes(3)
        expect(region.update).toHaveBeenLastCalledWith({
            'flags.Ilaris.zone.membership': ['target-token'],
        })
        expect(global.foundry.utils.fromUuid).toHaveBeenCalledTimes(4)
    })

    test('does not dispatch an entry while a newly created Region is initializing', async () => {
        const target = {
            id: 'target-token',
            actor: { id: 'target-actor', name: 'Target', isToken: true },
            actorLink: false,
        }
        const region = {
            id: 'persistent-region',
            flags: {
                Ilaris: {
                    zone: {
                        initializing: true,
                        profile: {
                            targeting: { includeCaster: false },
                            trigger: { onEnter: true },
                        },
                        membership: [],
                    },
                },
            },
            tokens: new Set([target]),
            update: jest.fn(),
        }

        await updatePersistentZoneMembership({ regions: [region] })

        expect(region.update).not.toHaveBeenCalled()
        expect(global.foundry.utils.fromUuid).not.toHaveBeenCalled()
    })

    test('applies a passive Zone to initial occupants, removes it on leave, and restores it on re-entry', async () => {
        const targetActor = {
            id: 'target-actor',
            name: 'Target',
            effects: [],
            deleteEmbeddedDocuments: jest.fn(async (_type, ids) => {
                targetActor.effects = targetActor.effects.filter(
                    (effect) => !ids.includes(effect.id),
                )
            }),
        }
        const target = {
            id: 'target-token',
            actor: targetActor,
            actorLink: false,
        }
        const zone = {
            lifecycle: 'persistent',
            effectMode: 'passive',
            duration: { type: 'sceneRounds', remaining: 3, originalValue: 3 },
            targeting: { includeCaster: false },
            trigger: { triggerOnCreate: true, onEnter: true },
        }
        const preEffects = [
            {
                baseDuration: 3,
                instant: false,
                changes: [{ key: 'system.test', type: 'add', value: '1' }],
            },
        ]
        let state
        const region = {
            id: 'passive-region',
            tokens: new Set([target]),
            update: jest.fn(async (change) => {
                if (change['flags.Ilaris.zone.membership'])
                    state.membership = change['flags.Ilaris.zone.membership']
                if ('flags.Ilaris.zone.initializing' in change)
                    state.initializing = change['flags.Ilaris.zone.initializing']
            }),
        }
        const scene = {
            regions: [region],
            tokens: new Map([[target.id, target]]),
            createEmbeddedDocuments: jest.fn(async (_type, [data]) => {
                state = data.flags.Ilaris.zone
                region.flags = { Ilaris: { zone: state } }
                region.parent = scene
                return [region]
            }),
        }
        global.game.actors.get.mockImplementation((id) =>
            id === targetActor.id ? targetActor : null,
        )
        global.canvas.tokens.get.mockImplementation((id) => (id === target.id ? target : null))
        global.foundry.utils.fromUuid.mockImplementation((uuid) => {
            if (uuid === 'Item.passive') return { uuid, name: 'Passive spell', system: {} }
            if (uuid === 'Actor.caster') return { uuid, id: 'caster', name: 'Caster' }
            return null
        })
        global.ActiveEffect.createDocuments = jest.fn(async ([data]) => {
            targetActor.effects.push({ id: `effect-${targetActor.effects.length}`, ...data })
        })

        await createPersistentZone({
            scene,
            regionData: { name: 'Passive Zone', shapes: [] },
            dialog: {
                item: { uuid: 'Item.passive' },
                actor: { uuid: 'Actor.caster' },
                zoneCasterTokenId: 'caster-token',
                armedInputValues: {},
                maneuverDurationBonus: 0,
                maechtigeMagieQs: 0,
                getSelectedSpellModificationId: () => '',
            },
            zone,
            preEffects,
        })

        expect(targetActor.effects).toHaveLength(1)
        expect(targetActor.effects[0].flags.ilaris).toMatchObject({
            passiveZone: true,
            zoneRegionId: 'passive-region',
            targetTokenId: 'target-token',
        })

        region.tokens = new Set()
        await updatePersistentZoneMembership(scene)
        expect(targetActor.effects).toHaveLength(0)

        region.tokens = new Set([target])
        await updatePersistentZoneMembership(scene)
        expect(targetActor.effects).toHaveLength(1)
    })

    test('uses the updated Token source containment when Region membership is still stale', async () => {
        const targetActor = {
            id: 'target-actor',
            effects: [
                {
                    id: 'owned-effect',
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'passive-region',
                            zoneApplicationId: 'zone-application-id:target-token',
                            targetTokenId: 'target-token',
                            spellUuid: 'Item.passive',
                            preEffectIndex: 0,
                        },
                    },
                },
            ],
            deleteEmbeddedDocuments: jest.fn(async (_type, ids) => {
                targetActor.effects = targetActor.effects.filter(
                    (effect) => !ids.includes(effect.id),
                )
            }),
        }
        const target = {
            id: 'target-token',
            actor: targetActor,
            actorLink: false,
            testInsideRegion: jest.fn(() => false),
        }
        const zone = {
            applicationId: 'zone-application-id',
            spellUuid: 'Item.passive',
            profile: { effectMode: 'passive', targeting: { includeCaster: false } },
            preEffects: [{ instant: false }],
            membership: ['target-token'],
        }
        const region = {
            id: 'passive-region',
            flags: { Ilaris: { zone } },
            // Foundry may not have refreshed this collection when updateToken fires.
            tokens: new Set([target]),
            update: jest.fn(async (change) => {
                if (change['flags.Ilaris.zone.membership'])
                    zone.membership = change['flags.Ilaris.zone.membership']
            }),
        }
        const scene = { regions: [region], tokens: new Map([[target.id, target]]) }

        await updatePersistentZoneMembership(scene, target)

        expect(target.testInsideRegion).toHaveBeenCalledWith(region)
        expect(targetActor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            'owned-effect',
        ])
        expect(zone.membership).toEqual([])
    })

    test("cleans all and only a deleted Region's passive effects, including a persisted Scene reload", async () => {
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
                            spellUuid: 'Item.passive',
                            preEffectIndex: 0,
                        },
                    },
                },
                {
                    id: 'other',
                    flags: {
                        ilaris: {
                            passiveZone: true,
                            zoneRegionId: 'region-b',
                            zoneApplicationId: 'cast-b:token-a',
                            targetTokenId: 'token-a',
                            spellUuid: 'Item.passive',
                            preEffectIndex: 0,
                        },
                    },
                },
            ],
            deleteEmbeddedDocuments: jest.fn(),
        }
        const zone = {
            applicationId: 'cast-a',
            spellUuid: 'Item.passive',
            preEffects: [{ instant: false }],
            profile: { effectMode: 'passive', targeting: { includeCaster: false } },
            membership: ['token-a'],
        }
        const region = { id: 'region-a', flags: { Ilaris: { zone } }, tokens: new Set() }
        await cleanupPassiveZoneEffects(region)
        expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled()

        global.game.actors.values.mockReturnValue([actor])
        await cleanupPassiveZoneEffects(region)
        expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', ['owned'])

        const reloaded = { ...region, tokens: new Set(), update: jest.fn() }
        await reconcilePersistentPassiveZones({ regions: [reloaded] })
        expect(reloaded.update).toHaveBeenCalledWith({ 'flags.Ilaris.zone.membership': [] })
    })

    test('creates a visible inert draft Region and only deletes it for its owner', async () => {
        const draft = {
            id: 'draft-region',
            flags: {
                Ilaris: {
                    zoneDraft: {
                        ownerUserId: 'player',
                        dialogId: 'dialog',
                        draftId: 'draft-region',
                    },
                },
            },
            delete: jest.fn(),
        }
        const scene = {
            createEmbeddedDocuments: jest.fn().mockResolvedValue([draft]),
            regions: new Map([[draft.id, draft]]),
        }

        const created = await createZoneDraftRegion({
            scene,
            regionData: { name: 'Ilaris Zone' },
            draftId: draft.id,
            ownerUserId: 'player',
            dialogId: 'dialog',
        })

        expect(created).toBe(draft)
        expect(scene.createEmbeddedDocuments).toHaveBeenCalledWith('Region', [
            expect.objectContaining({
                _id: 'draft-region',
                flags: {
                    Ilaris: {
                        zoneDraft: {
                            ownerUserId: 'player',
                            dialogId: 'dialog',
                            draftId: 'draft-region',
                        },
                    },
                },
            }),
        ])
        await expect(
            deleteZoneDraftRegion({ scene, draftId: draft.id, ownerUserId: 'other-player' }),
        ).resolves.toBe(false)
        await expect(
            deleteZoneDraftRegion({ scene, draftId: draft.id, ownerUserId: 'player' }),
        ).resolves.toBe(true)
        expect(draft.delete).toHaveBeenCalledTimes(1)
    })
})
