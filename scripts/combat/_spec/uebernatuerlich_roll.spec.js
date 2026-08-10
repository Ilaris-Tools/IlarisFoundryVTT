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
            { messageMode: false },
        )
        expect(dialog.applyEnergyCost).toHaveBeenCalledWith(true, true)
    })

    test('keeps selected spell forms dialog-local and resolves their effective profile', () => {
        const item = {
            name: 'Attributo',
            type: 'zauber',
            system: {
                schwierigkeit: '12',
                kosten: '4',
                ziel: 'Selbst',
                reichweite: 'Beruehrung',
                wirkungsdauer: '1 Stunde',
                spellModificationGroups: [{ id: 'attribute', required: true }],
                spellModifications: [
                    {
                        id: 'ff',
                        name: 'FF',
                        group: 'attribute',
                        profile: { difficulty: -2, cost: { mode: 'set', value: 8 } },
                    },
                ],
            },
            setManoevers: jest.fn(),
        }
        const actor = {
            type: 'held',
            vorteil: { magie: [], karma: [], allgemein: [], zaubertraditionen: [] },
        }
        const dialog = new UebernatuerlichDialog(actor, item)
        dialog.selectedSpellModificationIds = ['ff']
        dialog.spellModificationContext = null

        expect(dialog.getEffectiveSpellProfile()).toMatchObject({ difficulty: 10, cost: 8 })
        expect(dialog.getEffectiveSpellProfileText()).toContain('Zaubermodifikation: FF')
        expect(item.system).not.toHaveProperty('selectedSpellModificationIds')
    })

    test('rejects a missing required spell-form choice before mutating maneuver state', async () => {
        const item = {
            name: 'Attributo',
            type: 'zauber',
            system: {
                spellModificationGroups: [{ id: 'attribute', label: 'Attribut', required: true }],
                spellModifications: [{ id: 'ff', group: 'attribute' }],
            },
            setManoevers: jest.fn(),
        }
        const actor = {
            type: 'held',
            vorteil: { magie: [], karma: [], allgemein: [], zaubertraditionen: [] },
        }
        const dialog = new UebernatuerlichDialog(actor, item)
        dialog.element = { querySelectorAll: jest.fn(() => []) }

        await expect(dialog.manoeverAuswaehlen()).resolves.toBe(false)
        expect(ui.notifications.error).toHaveBeenCalledWith(expect.stringContaining('genau eine'))
    })

    test('includes selected form rules text in the cast summary', () => {
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.item = {
            system: { ziel: 'Selbst', reichweite: 'BerÃ¼hrung', wirkungsdauer: 'sofort' },
        }
        dialog.getEffectiveSpellModificationContext = () => ({
            selectedForms: [
                {
                    name: 'Zauber aufheben',
                    description: 'Die Aufhebung wird durch Spielleitung und Spieler verwaltet.',
                },
            ],
            profile: {
                target: 'Zauber',
                range: '8 Schritt',
                duration: 'augenblicklich',
                permanentCost: 'Halbe Basiskosten des Zielzaubers',
            },
        })

        expect(dialog.getEffectiveSpellProfileText()).toContain(
            'Die Aufhebung wird durch Spielleitung und Spieler verwaltet.',
        )
    })
})
