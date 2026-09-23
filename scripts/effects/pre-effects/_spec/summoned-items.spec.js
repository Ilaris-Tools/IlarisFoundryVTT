import { summonItemFromPreEffect } from '../summoned-items.js'

describe('summoned items', () => {
    beforeEach(() => {
        global.foundry.utils.deepClone = jest.fn((value) => structuredClone(value))
        global.foundry.utils.setProperty = jest.fn((object, path, value) => {
            const [root, key] = path.split('.')
            object[root] ??= {}
            object[root][key] = value
        })
        global.game.settings.get = jest.fn(() => '["Ilaris.waffen"]')
        global.fromUuid = jest.fn().mockResolvedValue({
            pack: 'Ilaris.waffen',
            type: 'fernkampfwaffe',
            uuid: 'Compendium.Ilaris.waffen.Item.source',
            toObject: () => ({
                _id: 'source',
                name: 'Summon',
                type: 'fernkampfwaffe',
                system: {},
            }),
        })
        global.ActiveEffect.createDocuments = jest.fn().mockResolvedValue([])
        global.ui = { notifications: { error: jest.fn() } }
    })

    it('creates a configured clone and a separately linked owner-turn marker', async () => {
        const clone = { id: 'clone', type: 'fernkampfwaffe', system: { hauptwaffe: true } }
        const actor = {
            items: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([clone]),
            updateEmbeddedDocuments: jest.fn(),
            deleteEmbeddedDocuments: jest.fn(),
        }

        await expect(
            summonItemFromPreEffect({
                targetActor: actor,
                preEffect: {
                    summonItem: {
                        sourceKind: 'waffe',
                        sourceUuid: 'Compendium.Ilaris.waffen.Item.source',
                        overrides: [
                            {
                                path: 'system.tp',
                                value: '2W20',
                                maechtigBonus: '+1W20',
                                amplifiedByMaechtigeMagie: true,
                            },
                        ],
                    },
                },
                caster: { uuid: 'Actor.caster' },
                spellItem: { name: 'Phexens Sternenwurf', uuid: 'Item.spell' },
                effectiveDuration: 64,
                maechtigeQs: 2,
                preEffectIndex: 0,
                applicationId: 'application',
            }),
        ).resolves.toBe(clone)

        expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
            expect.objectContaining({
                system: expect.objectContaining({
                    hauptwaffe: true,
                    tp: '2W20+1W20+1W20',
                }),
                flags: expect.objectContaining({
                    ilaris: expect.objectContaining({ applicationId: 'application' }),
                }),
            }),
        ])
        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    flags: expect.objectContaining({
                        ilaris: expect.objectContaining({
                            summonedItemId: 'clone',
                            applicationId: 'application',
                        }),
                    }),
                    system: expect.objectContaining({
                        ilarisTiming: expect.objectContaining({ remaining: 64 }),
                    }),
                }),
            ],
            { parent: actor },
        )
    })

    it('allows a source from the separately configured Gegenstände catalog', async () => {
        global.game.settings.get.mockImplementation((_namespace, key) => {
            if (key === 'waffenPacks') return '["Ilaris.waffen"]'
            if (key === 'gegenstandPacks') return '["Ilaris.gegenstande"]'
            return '[]'
        })
        global.fromUuid.mockResolvedValueOnce({
            pack: 'Ilaris.gegenstande',
            type: 'gegenstand',
            uuid: 'Compendium.Ilaris.gegenstande.Item.source',
            toObject: () => ({
                _id: 'source',
                name: 'Beschworener Gegenstand',
                type: 'gegenstand',
                system: {},
            }),
        })
        const clone = { id: 'clone', type: 'gegenstand', system: {} }
        const actor = {
            items: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([clone]),
            updateEmbeddedDocuments: jest.fn(),
            deleteEmbeddedDocuments: jest.fn(),
        }

        await expect(
            summonItemFromPreEffect({
                targetActor: actor,
                preEffect: {
                    summonItem: {
                        sourceKind: 'gegenstand',
                        sourceUuid: 'Compendium.Ilaris.gegenstande.Item.source',
                    },
                },
                caster: { uuid: 'Actor.caster' },
                spellItem: { name: 'Firuns Einsicht', uuid: 'Item.spell' },
                effectiveDuration: 16,
                maechtigeQs: 0,
                preEffectIndex: 0,
                applicationId: 'application',
            }),
        ).resolves.toBe(clone)

        expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [
            expect.objectContaining({ type: 'gegenstand' }),
        ])
    })

    it('rejects a source from the other configured catalog', async () => {
        global.game.settings.get.mockImplementation((_namespace, key) => {
            if (key === 'waffenPacks') return '["Ilaris.waffen"]'
            if (key === 'gegenstandPacks') return '[]'
            return '[]'
        })
        const actor = { createEmbeddedDocuments: jest.fn() }

        await expect(
            summonItemFromPreEffect({
                targetActor: actor,
                preEffect: {
                    summonItem: {
                        sourceKind: 'gegenstand',
                        sourceUuid: 'Compendium.Ilaris.waffen.Item.source',
                    },
                },
                caster: { uuid: 'Actor.caster' },
                spellItem: { name: 'Firuns Einsicht', uuid: 'Item.spell' },
                effectiveDuration: 16,
                maechtigeQs: 0,
                preEffectIndex: 0,
                applicationId: 'application',
            }),
        ).resolves.toBeNull()

        expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled()
    })
})
