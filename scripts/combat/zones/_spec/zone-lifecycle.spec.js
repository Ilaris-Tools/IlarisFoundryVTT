import {
    classifyZoneMembership,
    createPersistentZone,
    createZoneDraftRegion,
    deleteZoneDraftRegion,
    reducePersistentZoneDurations,
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
