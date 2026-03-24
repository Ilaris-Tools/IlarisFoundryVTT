import { jest } from '@jest/globals'

describe('UebernatuerlichDialog roll execution', () => {
    let UebernatuerlichDialog
    let mockRoll

    beforeAll(async () => {
        global.foundry.applications.api = {
            ApplicationV2: class ApplicationV2 {
                constructor(options = {}) {
                    this.options = options
                }

                async _prepareContext() {
                    return {}
                }

                async _onRender() {}

                render() {}
            },
            HandlebarsApplicationMixin: (Base) => class extends Base {},
        }
        ;({ UebernatuerlichDialog } = await import('../dialogs/uebernatuerlich.js'))
    })

    beforeEach(() => {
        jest.clearAllMocks()

        mockRoll = {
            evaluate: jest.fn().mockResolvedValue({ _total: 20 }),
            dice: [{ results: [{ active: true, result: 20 }] }],
            toMessage: jest.fn().mockResolvedValue({}),
        }

        global.Roll = jest.fn().mockImplementation(() => mockRoll)
        global.ChatMessage = {
            getSpeaker: jest.fn().mockReturnValue({ alias: 'Caster' }),
            create: jest.fn().mockResolvedValue({}),
            getWhisperRecipients: jest.fn().mockReturnValue(['GM']),
        }
        global.game = {
            settings: {
                get: jest.fn().mockImplementation((scope, key) => {
                    if (scope === 'core' && key === 'rollMode') return 'roll'
                    return false
                }),
            },
            user: {
                id: 'user-id',
                targets: new Set(),
            },
        }
        global.CONFIG = {
            ILARIS: {},
            Dice: { rollModes: {} },
        }
        global.ui = {
            notifications: {
                error: jest.fn(),
            },
        }
    })

    test('uses evaluate_roll_with_crit result and posts to chat before applying energy cost', async () => {
        const actor = {
            type: 'held',
            system: {
                modifikatoren: {},
                abgeleitete: { asp_stern: 12 },
                schips: { schips_stern: 0 },
            },
            vorteil: {
                kampf: [],
                magie: [],
                karma: [],
            },
            update: jest.fn().mockResolvedValue({}),
            getActiveTokens: jest.fn().mockReturnValue([]),
        }
        const item = {
            name: 'Feuerball',
            type: 'zauber',
            system: {
                pw: 5,
                schwierigkeit: '15',
                kosten: '4',
                manoever: {},
            },
            setManoevers: jest.fn().mockResolvedValue(),
        }

        const dialog = new UebernatuerlichDialog(actor, item)
        dialog.text_at = 'Zaubermod: +2'
        dialog.text_energy = 'Kosten sparen: -1'
        dialog.mod_at = 0
        dialog.fumble_val = 1
        dialog.dialogId = 'test-dialog'
        dialog.element = {
            querySelector: jest.fn().mockImplementation((selector) => {
                if (selector === 'input[name="xd20"]:checked') {
                    return { value: '0' }
                }
                return null
            }),
        }
        dialog.manoeverAuswaehlen = jest.fn().mockResolvedValue()
        dialog.updateManoeverMods = jest.fn().mockResolvedValue()
        dialog.updateStatusMods = jest.fn(() => {
            dialog.at_abzuege_mod = 0
        })
        dialog.initializeEnergyValues = jest.fn().mockResolvedValue()
        dialog.applyEnergyCost = jest.fn().mockResolvedValue()
        dialog.refreshActorData = jest.fn().mockResolvedValue()

        await dialog._angreifenKlick()

        expect(mockRoll.toMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                speaker: { alias: 'Caster' },
                flavor: '<h3>Kritischer Erfolg</h3>',
            }),
            { rollMode: 'roll' },
        )
        expect(dialog.applyEnergyCost).toHaveBeenCalledWith(true, true)
    })
})
