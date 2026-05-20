import { jest } from '@jest/globals'

describe('UebernatuerlichTalentSheet', () => {
    let UebernatuerlichTalentSheet

    beforeAll(async () => {
        global.foundry.applications.api = {
            HandlebarsApplicationMixin: (Base) => class extends Base {},
        }
        global.foundry.applications.sheets = {
            ItemSheetV2: class ItemSheetV2 {
                constructor(document) {
                    this.document = document
                    this.item = document
                    this.actor = document.actor
                }

                async _prepareContext() {
                    return {
                        item: this.item,
                        hasOwner: false,
                        config: CONFIG.ILARIS,
                        CONFIG,
                    }
                }
            },
        }

        global.CONFIG = {
            ILARIS: {},
        }
        ;({ UebernatuerlichTalentSheet } = await import('../sheets/uebernatuerlich-talent.js'))
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('adds existing embedded effects to the sheet context', async () => {
        const item = {
            name: 'Flammenlanze',
            type: 'zauber',
            actor: null,
            effects: [{ _id: 'effect-1', name: 'Brennend' }],
        }

        const sheet = new UebernatuerlichTalentSheet(item)
        const context = await sheet._prepareContext({})

        expect(context.effects).toEqual([{ _id: 'effect-1', name: 'Brennend' }])
    })

    it('creates new supernatural item effects with preEffect defaults', async () => {
        const item = {
            name: 'Segnung',
            type: 'liturgie',
            uuid: 'Item.liturgie-1',
            actor: null,
            effects: [],
            createEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        }

        const sheet = new UebernatuerlichTalentSheet(item)
        await sheet._createEffect()

        expect(item.createEmbeddedDocuments).toHaveBeenCalledWith('ActiveEffect', [
            expect.objectContaining({
                origin: 'Item.liturgie-1',
                flags: expect.objectContaining({
                    Ilaris: expect.objectContaining({
                        preEffect: expect.objectContaining({
                            targetMode: 'direct',
                            applicationType: 'persistent',
                            startLogic: 'onUse',
                        }),
                    }),
                }),
            }),
        ])
    })
})
