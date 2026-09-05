import {
    applySummonCreatureOverrides,
    findSummonerToken,
    findSummonPlacement,
    getCreatureSourceOptions,
    getPlacementCandidates,
    resolveSummonCreatureSource,
    releaseSummonedCreatureBoundResource,
    dominationDialogOptions,
    registerSummonDominationResolutionListener,
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

    it('uses the sole active-scene token when the summoner is no longer controlled', () => {
        const casterToken = { id: 'caster-token', actorId: 'caster' }
        global.canvas = { tokens: { controlled: [] } }

        expect(findSummonerToken({ tokens: [casterToken] }, { id: 'caster' })).toBe(casterToken)
    })

    it('requires explicit control when multiple active-scene tokens represent the summoner', () => {
        global.canvas = { tokens: { controlled: [] } }

        expect(
            findSummonerToken(
                {
                    tokens: [
                        { id: 'first-caster-token', actorId: 'caster' },
                        { id: 'second-caster-token', actorId: 'caster' },
                    ],
                },
                { id: 'caster' },
            ),
        ).toBeNull()
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

    it('keeps the canonical _uuid supplied by a Foundry compendium index', async () => {
        const pack = game.packs.get('Ilaris.kreaturen')
        pack.getIndex = jest.fn().mockResolvedValue([
            {
                _id: 'daemon',
                _uuid: 'Compendium.Ilaris.kreaturen.Actor.canonical-daemon',
                name: 'Azzitai',
                type: 'kreatur',
                system: { kreaturentyp: 'daemon' },
            },
        ])

        await expect(getCreatureSourceOptions(['daemon'])).resolves.toEqual([
            expect.objectContaining({
                uuid: 'Compendium.Ilaris.kreaturen.Actor.canonical-daemon',
            }),
        ])
    })

    it('accepts a selected creature whose configured pack is exposed through compendium metadata', async () => {
        const source = {
            documentName: 'Actor',
            type: 'kreatur',
            compendium: { collection: 'Ilaris.kreaturen' },
            system: { kreaturentyp: 'untot' },
        }
        global.fromUuid = jest.fn().mockResolvedValue(source)

        await expect(
            resolveSummonCreatureSource('Compendium.Ilaris.kreaturen.Actor.skeleton', ['untot']),
        ).resolves.toBe(source)
    })

    it('accepts a selected creature by its canonical configured-pack UUID', async () => {
        const source = {
            documentName: 'Actor',
            type: 'kreatur',
            pack: { collection: 'Ilaris.kreaturen' },
            system: { kreaturentyp: 'untot' },
        }
        global.fromUuid = jest.fn().mockResolvedValue(source)

        await expect(
            resolveSummonCreatureSource('Compendium.Ilaris.kreaturen.Actor.skeleton', ['untot']),
        ).resolves.toBe(source)
    })

    it('requests Ilaris creature fields when a pack already has its default index', async () => {
        const pack = game.packs.get('Ilaris.kreaturen')
        pack.index = [{ _id: 'daemon', name: 'Azzitai', type: 'kreatur' }]
        pack.getIndex = jest.fn().mockResolvedValue([
            {
                _id: 'daemon',
                name: 'Azzitai',
                type: 'kreatur',
                system: {
                    kreaturentyp: 'daemon',
                    summoningDifficulty: 16,
                    summoningCost: 6,
                },
            },
        ])

        await expect(getCreatureSourceOptions(['daemon'])).resolves.toEqual([
            expect.objectContaining({ summoningDifficulty: 16, summoningCost: 6 }),
        ])
        expect(pack.getIndex).toHaveBeenCalledWith({
            fields: [
                'type',
                'system.kreaturentyp',
                'system.summoningDifficulty',
                'system.summoningCost',
            ],
        })
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

    it('prepares attribute and skill domination probes with their fixed difficulty', () => {
        global.CONFIG = { ILARIS: { label: { MU: 'Mut' } } }
        const caster = {
            system: { attribute: { MU: { pw: 9 } } },
            profan: {
                fertigkeiten: [
                    {
                        name: 'Willenskraft',
                        system: {
                            pw: 11,
                            attribut_0: 'MU',
                            attribut_1: 'KL',
                            talente: [{ name: 'Beschwörung' }],
                        },
                    },
                ],
            },
        }

        expect(
            dominationDialogOptions(caster, {
                probeType: 'attribut',
                attribut: 'MU',
                difficulty: 15,
            }),
        ).toMatchObject({ probeType: 'attribut', fertigkeitName: 'Mut', pw: 9, success_val: 15 })
        expect(
            dominationDialogOptions(caster, {
                probeType: 'fertigkeit',
                fertigkeit: 'Willenskraft',
                talent: 'Beschwörung',
                difficulty: 18,
            }),
        ).toMatchObject({
            probeType: 'fertigkeit',
            fertigkeitName: 'Willenskraft',
            pw: 11,
            success_val: 18,
            initialTalent: 'Beschwörung',
        })
    })

    it('reports a domination result without changing the created summon', () => {
        global.Hooks = { on: jest.fn() }
        global.ui.notifications.info = jest.fn()
        const token = { id: 'summoned-token' }
        const dialog = { _summonDominationContext: { creatureName: 'Azzitai' } }

        registerSummonDominationResolutionListener()
        const callback = global.Hooks.on.mock.calls.find(
            ([event]) => event === 'Ilaris.postSkillRoll',
        )[1]
        callback(dialog, { rollResult: { success: false } })

        expect(global.ui.notifications.info).toHaveBeenCalledWith(
            'Beherrschungsprobe für Azzitai: misslungen.',
        )
        expect(token).toEqual({ id: 'summoned-token' })
        expect(dialog).not.toHaveProperty('_summonDominationContext')
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
        expect(created.setFlag).not.toHaveBeenCalled()
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

    it('releases a gKaP reservation only once', async () => {
        const caster = {
            system: { abgeleitete: { gkap: 3 } },
            update: jest.fn().mockImplementation(async (update) => {
                caster.system.abgeleitete.gkap = update['system.abgeleitete.gkap']
            }),
        }
        let released = false
        const token = {
            flags: {
                ilaris: {
                    summonCreature: {
                        boundResource: { casterUuid: 'Actor.caster', resource: 'gkap', amount: 3 },
                    },
                },
            },
            getFlag: jest.fn(() => released),
            setFlag: jest.fn(async () => {
                released = true
            }),
        }
        global.fromUuid = jest.fn().mockResolvedValue(caster)

        await releaseSummonedCreatureBoundResource(token)
        await releaseSummonedCreatureBoundResource(token)

        expect(caster.system.abgeleitete.gkap).toBe(0)
        expect(caster.update).toHaveBeenCalledTimes(1)
        expect(token.setFlag).not.toHaveBeenCalled()
    })

    it('coalesces concurrent release lifecycle calls for the same token', async () => {
        const caster = {
            system: { abgeleitete: { gasp: 2 } },
            update: jest.fn().mockImplementation(async (update) => {
                caster.system.abgeleitete.gasp = update['system.abgeleitete.gasp']
            }),
        }
        const token = {
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
        global.fromUuid = jest.fn().mockResolvedValue(caster)

        await Promise.all([
            releaseSummonedCreatureBoundResource(token),
            releaseSummonedCreatureBoundResource(token),
        ])

        expect(caster.system.abgeleitete.gasp).toBe(0)
        expect(caster.update).toHaveBeenCalledTimes(1)
        expect(token.setFlag).not.toHaveBeenCalled()
    })

    it('records release completion when the bound summoner is unavailable', async () => {
        const token = {
            flags: {
                ilaris: {
                    summonCreature: {
                        boundResource: { casterUuid: 'Actor.missing', resource: 'gasp', amount: 2 },
                    },
                },
            },
            getFlag: jest.fn(() => false),
            setFlag: jest.fn(),
        }
        global.fromUuid = jest.fn().mockResolvedValue(null)

        await expect(releaseSummonedCreatureBoundResource(token)).resolves.toBeUndefined()

        expect(token.setFlag).not.toHaveBeenCalled()
    })
})
