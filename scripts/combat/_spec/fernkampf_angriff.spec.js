describe('FernkampfAngriffDialog summary context', () => {
    let FernkampfAngriffDialog

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
                gzkl_choice: {},
                lcht_choice: {},
                wttr_choice: {},
                bwng_choice: {},
                dckg_choice: {},
                kgtl_choice: {},
                label: {},
                schips_choice: {},
                trefferzonen: {},
                distance_choice: {},
            },
            Dice: {
                rollModes: {},
            },
        }
        ;({ FernkampfAngriffDialog } = await import('../dialogs/fernkampf-angriff.js'))
    })

    beforeEach(() => {
        jest.clearAllMocks()
        game.settings.get.mockReturnValue(false)
    })

    function createDialog() {
        const actor = {
            type: 'held',
            system: {
                abgeleitete: { globalermod: -2 },
                modifikatoren: { nahkampfmod: 1 },
                schips: { schips_stern: 0 },
            },
            vorteil: {
                kampf: [],
            },
        }

        const item = {
            name: 'Kurzbogen',
            system: {
                fk: 12,
                at: 0,
                computed: {},
                manoever: {
                    km_gzsl: { selected: '0' },
                },
            },
            getTp: jest.fn(() => '1W6+3'),
        }

        return new FernkampfAngriffDialog(actor, item)
    }

    it('builds attack and damage summary data for the template', () => {
        const dialog = createDialog()
        dialog.mod_at = -4
        dialog.mod_dm = 2
        dialog.text_at = 'Kombinierte Aktion\n'
        dialog.text_dm = 'Rüstungsbrechend +2\n'
        dialog.schaden = '1W6+3'

        const summary = dialog.getSummaryContext({ baseFK: 12 }, -2, 1, '1d20')

        expect(summary.title).toBe('Würfelaktionen:')
        expect(summary.sections).toHaveLength(2)

        expect(summary.sections[0]).toMatchObject({
            action: 'angreifen',
            heading: '🏹 Fernkampf: 1W20+7',
            showDivider: true,
        })
        expect(summary.sections[0].rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: 'Basis FK', value: '12' }),
                expect.objectContaining({
                    label: 'Status (Wunden/Furcht)',
                    value: '-2',
                }),
                expect.objectContaining({ label: 'Token Status', value: '+1' }),
            ]),
        )
        expect(summary.sections[0].totalRow).toMatchObject({
            text: 'Addierte Modifikatoren: -5',
        })

        expect(summary.sections[1]).toMatchObject({
            action: 'schaden',
            heading: '🩸 Schaden: 1W6+3 +2',
            showDivider: true,
        })
        expect(summary.sections[1].sections[0].items).toEqual(
            expect.arrayContaining([expect.objectContaining({ text: 'Rüstungsbrechend +2' })]),
        )
    })

    it('filters aimed-strike-only damage rows when aimed strike is not active', () => {
        const dialog = createDialog()
        dialog.text_dm = 'Trefferzone: Kopf gewählt\nGezielter Schlag: +4 gewählt\nWuchtschuss +2\n'

        const damageSummary = dialog.getDamageSummaryContext()

        expect(damageSummary.sections).toHaveLength(1)
        expect(damageSummary.sections[0].items).toEqual([
            expect.objectContaining({ text: 'Wuchtschuss +2' }),
        ])
    })

    it('disables damage summary actions when no damage formula exists', () => {
        const dialog = createDialog()
        dialog.item.getTp.mockReturnValue('')
        dialog.schaden = ''

        const damageSummary = dialog.getDamageSummaryContext()

        expect(damageSummary.action).toBeNull()
        expect(damageSummary.heading).toBe('🩸 Schaden: Kein Schadenwert')
        expect(damageSummary.headingClass).toBe('disabled')
        expect(damageSummary.rows[0].value).toBe('Nicht gesetzt')
    })
})
