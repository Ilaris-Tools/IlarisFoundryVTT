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
            uuid: 'Compendium.Ilaris.waffen.Item.source',
            toObject: () => ({
                _id: 'source',
                name: 'Summon',
                type: 'fernkampfwaffe',
                system: {},
            }),
        })
        global.ActiveEffect.createDocuments = jest.fn().mockResolvedValue([])
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
})
