import {
    applySummonCreatureOverrides,
    findSummonPlacement,
    getCreatureSourceOptions,
    getPlacementCandidates,
    releaseSummonedCreatureBoundResource,
    resolveDominationCheck,
    summonCreatureFromPreEffect,
} from '../summoned-creatures.js'

describe('summoned creatures', () => {
    beforeEach(() => {
        global.foundry.utils.diffObject = (original, other) => {
            if (Array.isArray(original) || Array.isArray(other))
                return JSON.stringify(original) === JSON.stringify(other)
                    ? []
                    : structuredClone(other)
            if (original && other && typeof original === 'object' && typeof other === 'object') {
                return Object.fromEntries(
                    Object.entries(other)
                        .map(([key, value]) => [
                            key,
                            global.foundry.utils.diffObject(original[key], value),
                        ])
                        .filter(([, value]) =>
                            value && typeof value === 'object' && !Array.isArray(value)
                                ? Object.keys(value).length
                                : value !== undefined,
                        ),
                )
            }
            return Object.is(original, other) ? undefined : other
        }
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
        global.game.actors = new Map()
        global.Actor = {
            implementation: {
                create: jest.fn(async (data) => {
                    const actor = {
                        id: `summon-base-${game.actors.size + 1}`,
                        flags: data.flags,
                        getFlag: (scope, key) => data.flags?.[scope]?.[key],
                        toObject: () => foundry.utils.deepClone(data),
                        getTokenDocument: jest.fn().mockResolvedValue({
                            width: 1,
                            height: 1,
                            toObject: () => ({ _id: 'source-token', width: 1, height: 1 }),
                        }),
                    }
                    game.actors.set(actor.id, actor)
                    return actor
                }),
            },
        }
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

    it('applies numeric values as numbers and formula values as additive terms without mutating the source', () => {
        const sourceData = {
            system: { kampfwerte: { ws: 3 } },
            items: [{ _id: 'attack', system: { at: 10, tp: '2W6-2' } }],
        }
        const overriddenData = foundry.utils.deepClone(sourceData)

        applySummonCreatureOverrides(
            overriddenData,
            [
                {
                    path: 'system.kampfwerte.ws',
                    value: 0,
                    amplifiedByMaechtigeMagie: true,
                    maechtigBonus: 1,
                },
                {
                    path: 'items.0.system.at',
                    value: 0,
                    amplifiedByMaechtigeMagie: true,
                    maechtigBonus: 1,
                },
                {
                    path: 'items.0.system.tp',
                    value: 0,
                    amplifiedByMaechtigeMagie: true,
                    maechtigBonus: 1,
                },
            ],
            2,
        )

        expect(overriddenData.system.kampfwerte.ws).toBe(5)
        expect(overriddenData.items[0].system.at).toBe(12)
        expect(overriddenData.items[0].system.tp).toBe('2W6-2+2')
        expect(sourceData).toEqual({
            system: { kampfwerte: { ws: 3 } },
            items: [{ _id: 'attack', system: { at: 10, tp: '2W6-2' } }],
        })
    })

    it('ignores malformed additions and unavailable override paths', () => {
        const sourceData = { system: { kampfwerte: { ws: 3 } }, items: [] }

        applySummonCreatureOverrides(
            sourceData,
            [
                { path: 'system.kampfwerte.ws', value: 'not-a-number' },
                { path: 'system.kampfwerte.missing', value: 1 },
                { value: 1 },
            ],
            2,
        )

        expect(sourceData).toEqual({ system: { kampfwerte: { ws: 3 } }, items: [] })
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

    it('uses a configured source and creates a timed owner-turn marker', async () => {
        const created = { id: 'summon-token', actor: { sheet: { render: jest.fn() } } }
        const scene = {
            uuid: 'Scene.test',
            dimensions: { width: 500, height: 500 },
            tokens: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([created]),
            deleteEmbeddedDocuments: jest.fn(),
        }
        global.canvas = {
            scene,
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 100, y: 100 } }] },
        }
        global.ActiveEffect = { createDocuments: jest.fn().mockResolvedValue([]) }
        const source = {
            documentName: 'Actor',
            type: 'kreatur',
            pack: 'Ilaris.kreaturen',
            uuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
            name: 'Azzitai',
            system: { kreaturentyp: 'daemon', kampfwerte: { ws: 3 } },
            toObject: () => ({
                _id: 'daemon',
                system: { kreaturentyp: 'daemon', kampfwerte: { ws: 3 } },
                items: [{ _id: 'attack', system: { at: 10, tp: '2W6-2' } }],
            }),
            getTokenDocument: jest.fn().mockResolvedValue({
                width: 1,
                height: 1,
                toObject: () => ({ width: 1, height: 1 }),
            }),
        }
        global.fromUuid = jest.fn().mockResolvedValue(source)

        await summonCreatureFromPreEffect({
            caster: {
                id: 'caster',
                uuid: 'Actor.caster',
                system: { abgeleitete: {} },
                update: jest.fn(),
            },
            preEffect: {
                summonCreature: {
                    sourceUuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
                    lifetime: 'timed',
                    overrides: [
                        {
                            path: 'system.kampfwerte.ws',
                            value: 0,
                            amplifiedByMaechtigeMagie: true,
                            maechtigBonus: 1,
                        },
                        {
                            path: 'items.0.system.tp',
                            value: 0,
                            amplifiedByMaechtigeMagie: true,
                            maechtigBonus: 1,
                        },
                    ],
                },
            },
            effectiveDuration: 16,
            maechtigeQs: 2,
            spellItem: { name: 'Krähenruf' },
        })

        expect(ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    flags: { ilaris: expect.objectContaining({ summonedTokenId: 'summon-token' }) },
                }),
            ],
            { parent: expect.any(Object) },
        )
        const importedActor = await Actor.implementation.create.mock.results[0].value
        expect(importedActor.getTokenDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                actorLink: false,
                delta: expect.objectContaining({
                    system: expect.objectContaining({ kampfwerte: { ws: 5 } }),
                    items: [expect.objectContaining({ system: { at: 10, tp: '2W6-2+2' } })],
                }),
            }),
        )
        expect(ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    duration: {},
                    flags: {
                        ilaris: expect.objectContaining({
                            summonedTokenId: 'summon-token',
                            summonedTokenUuid: 'Scene.test.Token.summon-token',
                            sourceUuid: 'Compendium.Ilaris.kreaturen.Actor.daemon',
                        }),
                    },
                }),
            ],
            { parent: expect.any(Object) },
        )
    })

    it('rejects an unavailable fixed source before creating a token', async () => {
        global.fromUuid = jest.fn().mockResolvedValue(null)
        global.canvas = {
            scene: { createEmbeddedDocuments: jest.fn() },
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 0, y: 0 } }] },
        }

        await expect(
            summonCreatureFromPreEffect({
                caster: { id: 'caster', system: { abgeleitete: {} }, update: jest.fn() },
                preEffect: {
                    summonCreature: {
                        sourceUuid: 'Compendium.Ilaris.kreaturen.Actor.missing',
                    },
                },
            }),
        ).resolves.toBeNull()

        expect(canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled()
        expect(ui.notifications.warn).toHaveBeenCalled()
    })

    it('does not create a duration marker for a permanent creature summon', async () => {
        const created = { id: 'permanent-token', actor: { sheet: { render: jest.fn() } } }
        global.ActiveEffect = { createDocuments: jest.fn() }
        global.canvas = {
            scene: {
                dimensions: { width: 500, height: 500 },
                tokens: [],
                createEmbeddedDocuments: jest.fn().mockResolvedValue([created]),
            },
            grid: { size: 100 },
            tokens: { controlled: [{ actor: { id: 'caster' }, document: { x: 100, y: 100 } }] },
        }
        global.fromUuid = jest.fn().mockResolvedValue({
            documentName: 'Actor',
            type: 'kreatur',
            pack: 'Ilaris.kreaturen',
            uuid: 'Compendium.Ilaris.kreaturen.Actor.untot',
            system: { kreaturentyp: 'untot' },
            toObject: () => ({ system: { kreaturentyp: 'untot' }, items: [] }),
            getTokenDocument: jest.fn().mockResolvedValue({
                width: 1,
                height: 1,
                toObject: () => ({ width: 1, height: 1 }),
            }),
        })

        await summonCreatureFromPreEffect({
            caster: { id: 'caster', system: { abgeleitete: {} }, update: jest.fn() },
            preEffect: {
                summonCreature: { sourceUuid: 'Compendium.Ilaris.kreaturen.Actor.untot' },
            },
        })

        expect(ActiveEffect.createDocuments).not.toHaveBeenCalled()
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
