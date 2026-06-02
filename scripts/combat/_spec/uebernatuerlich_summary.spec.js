describe('UebernatuerlichDialog summary context', () => {
    let UebernatuerlichDialog

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
                xd20_choice: {},
                schips_choice: {},
                trefferzonen: {},
                distance_choice: {},
            },
            Dice: { rollModes: {} },
        }
        const module = await import('../dialogs/uebernatuerlich.js')
        UebernatuerlichDialog = module.UebernatuerlichDialog
    })

    beforeEach(() => {
        jest.clearAllMocks()
        game.settings.get.mockReturnValue(false)
    })

    function createDialog() {
        const actor = {
            type: 'held',
            system: {
                abgeleitete: { globalermod: -1, asp_stern: 9, kap_stern: 7 },
                schips: { schips_stern: 0 },
            },
            vorteil: {
                kampf: [],
                magie: [],
            },
            uebernatuerlich: {
                zauber: [],
            },
        }

        const item = {
            name: 'Ignifaxius',
            type: 'zauber',
            system: {
                pw: 15,
                kosten: '8',
                schwierigkeit: 'variabel',
                manoever: {},
            },
        }

        return new UebernatuerlichDialog(actor, item)
    }

    it('builds template-ready talent and energy summary data', () => {
        const dialog = createDialog()
        dialog.mod_at = -3
        dialog.mod_energy = 6
        dialog.text_at = 'Mächtige Magie +2\n'
        dialog.text_energy = 'Kosten sparen -2 Energie\n'

        const summary = dialog.getSummaryContext({ basePW: 15 }, -1, 0, '3d20dl1dh1')

        expect(summary.sections).toHaveLength(2)
        expect(summary.sections[0]).toMatchObject({
            action: 'angreifen',
            heading: '🔮 Zauber: 3W20 (Median)+11',
        })
        expect(summary.sections[1]).toMatchObject({
            heading: '⚡ Energiekosten: 6 Energie',
            showDivider: true,
        })
        expect(summary.sections[1].footerRows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: 'Verfügbar', value: '9 Energie' }),
                expect.objectContaining({ label: 'Verbleibend', value: '3 Energie' }),
            ]),
        )
        expect(summary.sections[1].actionButtons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ action: 'energieErfolg' }),
                expect.objectContaining({ action: 'energieMisserfolg' }),
            ]),
        )
    })
})
