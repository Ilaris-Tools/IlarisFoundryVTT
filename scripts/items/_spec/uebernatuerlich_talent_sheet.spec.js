import { jest } from '@jest/globals'

describe('UebernatuerlichTalentSheet', () => {
    let UebernatuerlichTalentSheet

    beforeAll(async () => {
        global.foundry.applications.api = {
            ApplicationV2: class ApplicationV2 {
                constructor() {}

                async _prepareContext() {
                    return {}
                }

                render() {
                    return this
                }
            },
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
            getFlag: jest.fn().mockReturnValue([{ id: 'effect-1', name: 'Brennend' }]),
        }

        const sheet = new UebernatuerlichTalentSheet(item)
        const context = await sheet._prepareContext({})

        expect(context.preEffects).toEqual([
            expect.objectContaining({ id: 'effect-1', name: 'Brennend' }),
        ])
    })

    it('creates new supernatural item effects with preEffect defaults in flags', async () => {
        const item = {
            name: 'Segnung',
            type: 'liturgie',
            uuid: 'Item.liturgie-1',
            actor: null,
            getFlag: jest.fn().mockReturnValue([]),
            update: jest.fn().mockResolvedValue({}),
        }

        const sheet = new UebernatuerlichTalentSheet(item)
        await UebernatuerlichTalentSheet.DEFAULT_OPTIONS.actions.createPreEffect.call(sheet, null, {
            dataset: { action: 'createPreEffect' },
        })

        expect(item.update).toHaveBeenCalledWith({
            'flags.Ilaris.preEffects': [
                expect.objectContaining({
                    name: 'Segnung: Zieleffekt',
                    targetMode: 'direct',
                    applicationType: 'persistent',
                    startLogic: 'onUse',
                    changes: [
                        expect.objectContaining({
                            key: '',
                            mode: 2,
                            value: '0',
                        }),
                    ],
                }),
            ],
        })
    })
})
