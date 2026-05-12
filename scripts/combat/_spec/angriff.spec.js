describe('AngriffDialog summary context', () => {
    let AngriffDialog

    beforeAll(async () => {
        global.foundry.applications.api = {
            ApplicationV2: class ApplicationV2 {
                static DEFAULT_OPTIONS = { actions: {} }

                constructor(options = {}) {
                    this.options = options
                }

                async _prepareContext() {
                    return {}
                }

                async _onRender() {}

                async render() {
                    return this
                }
            },
            HandlebarsApplicationMixin: (BaseApplication) => class extends BaseApplication {},
        }

        global.ChatMessage = {
            getSpeaker: jest.fn(() => ({ actor: 'test-actor' })),
        }

        global.Hooks = {
            call: jest.fn(),
        }

        global.CONFIG = {
            ILARIS: {
                lcht_choice: {},
                schips_choice: {},
                trefferzonen: {},
                distance_choice: {},
            },
            Dice: { rollModes: {} },
        }

        const module = await import('../dialogs/angriff.js')
        AngriffDialog = module.AngriffDialog
    })

    beforeEach(() => {
        jest.clearAllMocks()
        game.settings.get.mockReturnValue(false)
    })

    function createDialog(options = {}) {
        const actor = {
            type: 'held',
            system: {
                abgeleitete: { globalermod: -2 },
                modifikatoren: { nahkampfmod: 1, verteidigungmod: 2 },
                schips: { schips_stern: 0 },
            },
            vorteil: { kampf: [] },
        }

        const item = {
            name: 'Schwert',
            system: {
                at: 14,
                vt: 13,
                manoverausgleich: {},
                manoever: {
                    km_gzsl: { selected: '0' },
                    vlof: { offensiver_kampfstil: false },
                },
                computed: {},
            },
            actor,
            getTp: jest.fn(() => '1W6+4'),
        }

        return new AngriffDialog(actor, item, options)
    }

    it('builds attack, defense, and damage sections for the summaries template', () => {
        const dialog = createDialog()
        dialog.mod_at = -3
        dialog.mod_vt = 2
        dialog.mod_dm = 1
        dialog.vt_abzuege_mod = -1
        dialog.text_at = 'Sturmangriff +4\n'
        dialog.text_vt = 'Volle Defensive +4\n'
        dialog.text_dm = 'Wuchtschlag +1\n'
        dialog.schaden = '1W6+4'

        const summary = dialog.getSummaryContext({ baseAT: 14, baseVT: 13 }, -2, 1, '1d20')

        expect(summary.sections).toHaveLength(3)
        expect(summary.sections[0]).toMatchObject({
            action: 'angreifen',
            heading: '🗡️ Angriff: 1W20+10',
        })
        expect(summary.sections[1]).toMatchObject({
            action: 'verteidigen',
            heading: '🛡️ Verteidigung: 1W20+16',
        })
        expect(summary.sections[2]).toMatchObject({
            action: 'schaden',
            heading: '🩸 Schaden: 1W6+4 +1',
        })
    })

    it('disables attack and damage summary actions in defense mode without riposte', () => {
        const dialog = createDialog({ isDefenseMode: true })

        const summary = dialog.getSummaryContext({ baseAT: 14, baseVT: 13 }, 0, 0, '1d20')

        expect(summary.sections[0].action).toBeNull()
        expect(summary.sections[0].headingClass).toBe('disabled')
        expect(summary.sections[2].action).toBeNull()
        expect(summary.sections[2].headingClass).toBe('disabled')
        expect(summary.sections[1].action).toBe('verteidigen')
    })
})
