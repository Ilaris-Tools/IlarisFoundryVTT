import {
    findSummonPlacement,
    getCreatureSourceOptions,
    getPlacementCandidates,
    releaseSummonedCreatureBoundResource,
    resolveDominationCheck,
    summonCreatureFromPreEffect,
} from '../summoned-creatures.js'

describe('summoned creatures', () => {
    beforeEach(() => {
        global.game.settings.get = jest.fn(() => '["Ilaris.kreaturen"]')
        global.game.packs = new Map([
            [
                'Ilaris.kreaturen',
                {
                    metadata: { type: 'Actor', label: 'Kreaturen' },
                    collection: 'Ilaris.kreaturen',
                    index: [
                        {
                            _id: 'daemon',
                            name: 'Azzitai',
                            type: 'kreatur',
                            system: { kreaturentyp: 'daemon' },
                        },
                        {
                            _id: 'held',
                            name: 'Alrik',
                            type: 'held',
                            system: { kreaturentyp: 'humanoid' },
                        },
                    ],
                },
            ],
        ])
        global.ui = { notifications: { warn: jest.fn(), error: jest.fn() } }
    })

    it('filters configured Actor packs by creature type and creates Actor UUIDs', async () => {
        await expect(getCreatureSourceOptions(['daemon'])).resolves.toEqual([
            expect.objectContaining({
                name: 'Azzitai',
                kreaturentyp: 'daemon',
                uuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            }),
        ])
    })

    it('uses a domination check only when it is enabled and matches the creature type', () => {
        const config = {
            dominationChecks: {
                enabled: true,
                entries: [
                    { kreaturentyp: 'daemon', difficulty: 16, probeType: 'attribut' },
                    { kreaturentyp: 'untot', difficulty: 12, probeType: 'fertigkeit' },
                ],
            },
        }

        expect(resolveDominationCheck(config, 'daemon')).toMatchObject({ difficulty: 16 })
        expect(resolveDominationCheck(config, 'elementar')).toBeUndefined()
        expect(
            resolveDominationCheck(
                { ...config, dominationChecks: { ...config.dominationChecks, enabled: false } },
                'daemon',
            ),
        ).toBeNull()
    })

    it('searches adjacent positions first and skips occupied positions', () => {
        const candidates = getPlacementCandidates(
            { x: 100, y: 100 },
            { width: 1, height: 1 },
            100,
            1,
        )
        expect(candidates[0]).toMatchObject({ x: 0, y: 0 })
        const placement = findSummonPlacement({
            scene: {
                dimensions: { width: 500, height: 500 },
                tokens: [{ x: 0, y: 0, width: 1, height: 1 }],
            },
            casterToken: { x: 100, y: 100 },
            summonedToken: { width: 1, height: 1 },
            gridSize: 100,
        })
        expect(placement).toMatchObject({ x: 0, y: 100 })
    })

    it('creates an unlinked scene token and opens its synthetic Actor sheet', async () => {
        const created = { actor: { sheet: { render: jest.fn() } } }
        const scene = {
            dimensions: { width: 500, height: 500 },
            tokens: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([created]),
        }
        global.canvas = {
            scene,
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 100, y: 100 } }] },
        }
        global.fromUuid = jest.fn().mockResolvedValue({
            documentName: 'Actor',
            type: 'kreatur',
            pack: 'Ilaris.kreaturen',
            uuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            system: { kreaturentyp: 'daemon' },
            getTokenDocument: jest.fn().mockResolvedValue({
                width: 1,
                height: 1,
                toObject: () => ({ _id: 'source-token', width: 1, height: 1 }),
            }),
        })

        await expect(
            summonCreatureFromPreEffect({
                caster: {
                    id: 'caster',
                    uuid: 'Actor.caster',
                    system: { abgeleitete: {} },
                    update: jest.fn(),
                },
                preEffect: { summonCreature: { kreaturentypen: ['daemon'] } },
                selectedCreatureUuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            }),
        ).resolves.toBe(created)

        expect(scene.createEmbeddedDocuments).toHaveBeenCalledWith('Token', [
            expect.objectContaining({ actorLink: false, x: 0, y: 0 }),
        ])
        expect(created.actor.sheet.render).toHaveBeenCalledWith(true)
    })

    it('keeps the summoned token when opening its sheet fails', async () => {
        const created = {
            actor: {
                sheet: {
                    render: jest.fn(() => {
                        throw new Error('sheet')
                    }),
                },
            },
        }
        const scene = {
            dimensions: { width: 500, height: 500 },
            tokens: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([created]),
        }
        global.canvas = {
            scene,
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 100, y: 100 } }] },
        }
        global.fromUuid = jest.fn().mockResolvedValue({
            documentName: 'Actor',
            type: 'kreatur',
            pack: 'Ilaris.kreaturen',
            uuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            system: { kreaturentyp: 'daemon' },
            getTokenDocument: jest.fn().mockResolvedValue({
                width: 1,
                height: 1,
                toObject: () => ({ width: 1, height: 1 }),
            }),
        })

        await expect(
            summonCreatureFromPreEffect({
                caster: { id: 'caster', system: { abgeleitete: {} }, update: jest.fn() },
                preEffect: { summonCreature: { kreaturentypen: ['daemon'] } },
                selectedCreatureUuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            }),
        ).resolves.toBe(created)

        expect(scene.createEmbeddedDocuments).toHaveBeenCalledTimes(1)
        expect(ui.notifications.warn).toHaveBeenCalled()
    })

    it('reserves a bound resource and releases it exactly once when the token is deleted', async () => {
        const caster = {
            uuid: 'Actor.caster',
            system: { abgeleitete: { gasp: 1, asp: 8 } },
            update: jest.fn().mockImplementation(async (update) => {
                caster.system.abgeleitete.gasp = update['system.abgeleitete.gasp']
            }),
        }
        global.fromUuid = jest.fn(async (uuid) => {
            if (uuid === 'Actor.caster') return caster
            return {
                documentName: 'Actor',
                type: 'kreatur',
                pack: 'Ilaris.kreaturen',
                uuid,
                system: { kreaturentyp: 'daemon' },
                getTokenDocument: jest.fn().mockResolvedValue({
                    width: 1,
                    height: 1,
                    toObject: () => ({ width: 1, height: 1 }),
                }),
            }
        })
        const created = {
            actor: { sheet: { render: jest.fn() } },
            flags: {
                ilaris: {
                    summonCreature: {
                        boundResource: { casterUuid: 'Actor.caster', resource: 'gasp', amount: 2 },
                    },
                },
            },
            getFlag: jest.fn(() => false),
            setFlag: jest.fn(),
        }
        global.canvas = {
            scene: {
                dimensions: { width: 500, height: 500 },
                tokens: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([created]),
            },
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 100, y: 100 } }] },
        }

        await summonCreatureFromPreEffect({
            caster: { ...caster, id: 'caster' },
            preEffect: {
                summonCreature: {
                    kreaturentypen: ['daemon'],
                    boundResourceCost: { enabled: true, resource: 'gasp', amount: 2 },
                },
            },
            selectedCreatureUuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
        })
        expect(caster.system.abgeleitete.gasp).toBe(3)

        await releaseSummonedCreatureBoundResource(created)
        expect(caster.system.abgeleitete.gasp).toBe(1)
        expect(created.setFlag).toHaveBeenCalledWith(
            'ilaris',
            'summonCreatureResourceReleased',
            true,
        )
    })

    it('does not create a token when the summoner cannot pay the binding resource', async () => {
        global.canvas = {
            scene: {
                dimensions: { width: 500, height: 500 },
                tokens: [],
                createEmbeddedDocuments: jest.fn(),
            },
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 100, y: 100 } }] },
        }
        global.fromUuid = jest.fn().mockResolvedValue({
            documentName: 'Actor',
            type: 'kreatur',
            pack: 'Ilaris.kreaturen',
            system: { kreaturentyp: 'daemon' },
            getTokenDocument: jest.fn().mockResolvedValue({
                width: 1,
                height: 1,
                toObject: () => ({ width: 1, height: 1 }),
            }),
        })

        await expect(
            summonCreatureFromPreEffect({
                caster: {
                    id: 'caster',
                    system: { abgeleitete: { gasp: 0, asp: 1 } },
                    update: jest.fn(),
                },
                preEffect: {
                    summonCreature: {
                        kreaturentypen: ['daemon'],
                        boundResourceCost: { enabled: true, resource: 'gasp', amount: 2 },
                    },
                },
                selectedCreatureUuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            }),
        ).resolves.toBeNull()

        expect(canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled()
    })
})
