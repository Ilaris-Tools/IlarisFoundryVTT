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

    it('shows applied effect sources while keeping suppressed components in a disclosure ledger', () => {
        const dialog = createDialog()
        dialog.actor.allApplicableEffects = () => [
            {
                name: 'Mirakel',
                system: {
                    ilarisSource: 'uebernatuerlich',
                    ilarisModifiers: [
                        {
                            phase: 'roll',
                            target: 'at',
                            value: '4',
                            stacking: 'strongest-supernatural',
                        },
                        {
                            phase: 'roll',
                            target: 'damage',
                            value: '3',
                            stacking: 'strongest-supernatural',
                        },
                        {
                            phase: 'roll',
                            target: 'vt',
                            value: '3',
                            stacking: 'strongest-supernatural',
                        },
                    ],
                },
            },
            {
                name: 'Attributo',
                system: {
                    ilarisSource: 'uebernatuerlich',
                    ilarisModifiers: [
                        {
                            phase: 'roll',
                            target: 'at',
                            value: '2',
                            stacking: 'strongest-supernatural',
                        },
                        {
                            phase: 'roll',
                            target: 'waffenschaden',
                            value: '2',
                            stacking: 'strongest-supernatural',
                        },
                    ],
                },
            },
        ]

        const summary = dialog.getSummaryContext({ baseAT: 14, baseVT: 13 }, 0, 0, '1d20')
        const attack = summary.sections[0]
        const defense = summary.sections[1]
        const damage = summary.sections[2]

        expect(attack.heading).toContain('1W20+18')
        expect(attack.rows).toEqual(
            expect.arrayContaining([expect.objectContaining({ label: 'Ilaris: Mirakel' })]),
        )
        expect(attack.suppression.entries).toEqual(
            expect.arrayContaining([expect.objectContaining({ sourceName: 'Attributo' })]),
        )
        expect(defense.rows).toEqual(
            expect.arrayContaining([expect.objectContaining({ label: 'Ilaris: Mirakel' })]),
        )
        expect(damage.heading).toContain('+3')
        expect(damage.suppression.entries).toEqual(
            expect.arrayContaining([expect.objectContaining({ sourceName: 'Attributo' })]),
        )
    })

    it('dispatches a selected confirmed-hit maneuver only to the resolved defender', async () => {
        const attacker = { id: 'attacker', uuid: 'Actor.attacker', system: {} }
        const defender = { id: 'defender', name: 'Defender', effects: [], system: {} }
        global.game.actors = { get: jest.fn((id) => (id === 'defender' ? defender : null)) }
        global.ActiveEffect.createDocuments = jest.fn().mockResolvedValue([])

        const dialog = Object.create(AngriffDialog.prototype)
        dialog.item = {
            manoever: [
                {
                    id: 'niederwerfen',
                    uuid: 'Compendium.Ilaris.manover.Item.niederwerfen',
                    name: 'Niederwerfen',
                    inputValue: { field: 'CHECKBOX', value: true },
                    system: {
                        preEffects: [
                            {
                                activation: 'onConfirmedHit',
                                baseDuration: 1,
                                changes: [
                                    {
                                        key: 'system.modifikatoren.nahkampfmod',
                                        type: 'add',
                                        value: '-4',
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        }

        await dialog._dispatchManeuverPreEffects(
            dialog._selectedManeuverPreEffects(),
            'onConfirmedHit',
            defender,
            attacker,
        )

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Niederwerfen',
                    flags: {
                        ilaris: expect.objectContaining({
                            sourceType: 'maneuver',
                            sourceActorUuid: 'Actor.attacker',
                        }),
                    },
                }),
            ],
            { parent: defender },
        )
    })

    it('dispatches a selected successful-defense maneuver only to the attacker', async () => {
        const defender = { id: 'defender', uuid: 'Actor.defender', system: {} }
        const attacker = { id: 'attacker', name: 'Attacker', effects: [], system: {} }
        global.game.actors = { get: jest.fn((id) => (id === 'attacker' ? attacker : null)) }
        global.ActiveEffect.createDocuments = jest.fn().mockResolvedValue([])

        const dialog = Object.create(AngriffDialog.prototype)
        dialog.item = {
            manoever: [
                {
                    id: 'binden',
                    uuid: 'Compendium.Ilaris.manover.Item.bind',
                    name: 'Binden',
                    inputValue: { field: 'NUMBER', value: 2 },
                    system: {
                        preEffects: [
                            {
                                activation: 'onSuccessfulDefense',
                                baseDuration: 1,
                                ilarisModifiers: [
                                    {
                                        target: 'vt',
                                        value: '-1',
                                        scaleWithInput: true,
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        }

        await dialog._dispatchManeuverPreEffects(
            dialog._selectedManeuverPreEffects(),
            'onSuccessfulDefense',
            attacker,
            defender,
        )

        const effect = global.ActiveEffect.createDocuments.mock.calls[0][0][0]
        expect(effect.system.ilarisModifiers).toEqual([
            expect.objectContaining({ target: 'vt', value: '-2' }),
        ])
        expect(global.ActiveEffect.createDocuments.mock.calls[0][1]).toEqual({ parent: attacker })
    })

    it.each([
        ['onConfirmedHit', 18],
        ['onSuccessfulDefense', 16],
    ])(
        'preserves the %s maneuver roll total for a resistance prompt',
        async (activation, total) => {
            const sourceActor = { id: 'source', uuid: 'Actor.source', system: {} }
            const targetActor = { id: 'target', name: 'Target', effects: [], system: {} }
            global.game.actors = { get: jest.fn((id) => (id === 'target' ? targetActor : null)) }
            global.game.users = [{ id: 'gm-id', active: true, isGM: true }]
            global.ChatMessage.create = jest.fn().mockResolvedValue(undefined)

            const dialog = Object.create(AngriffDialog.prototype)
            dialog.item = {
                manoever: [
                    {
                        id: 'resist-test',
                        uuid: 'Item.resist-test',
                        name: 'Resistance test',
                        inputValue: { field: 'CHECKBOX', value: true },
                        system: {
                            preEffects: [
                                {
                                    activation,
                                    baseDuration: 0,
                                    changes: [],
                                    avoidTest: {
                                        enabled: true,
                                        attribut: 'KK',
                                        resistDifficultySource: 'triggeringRoll',
                                    },
                                },
                            ],
                        },
                    },
                ],
            }

            await dialog._dispatchManeuverPreEffects(
                dialog._selectedManeuverPreEffects(),
                activation,
                targetActor,
                sourceActor,
                { success: true, roll: { total } },
            )

            const content = global.ChatMessage.create.mock.calls[0][0].content
            const serialized = content.match(/data-pre-effect-data="([^"]+)"/)[1]
            expect(JSON.parse(decodeURIComponent(serialized))).toMatchObject({
                triggeringRollTotal: total,
            })
        },
    )

    it('does not materialize the same maneuver application twice', async () => {
        const attacker = { id: 'attacker', uuid: 'Actor.attacker', system: {} }
        const defender = { id: 'defender', name: 'Defender', effects: [], system: {} }
        global.game.actors = { get: jest.fn(() => defender) }
        global.ActiveEffect.createDocuments = jest.fn(async ([data]) => {
            defender.effects.push({ id: 'created', ...data })
        })
        const dialog = Object.create(AngriffDialog.prototype)
        dialog.item = {
            manoever: [
                {
                    id: 'test',
                    uuid: 'Item.test',
                    name: 'Test',
                    inputValue: { field: 'CHECKBOX', value: true },
                    system: {
                        preEffects: [
                            {
                                activation: 'onConfirmedHit',
                                baseDuration: 1,
                                changes: [{ key: 'system.test', type: 'add', value: '1' }],
                            },
                        ],
                    },
                },
            ],
        }
        const snapshot = dialog._selectedManeuverPreEffects()

        await dialog._dispatchManeuverPreEffects(snapshot, 'onConfirmedHit', defender, attacker)
        await dialog._dispatchManeuverPreEffects(snapshot, 'onConfirmedHit', defender, attacker)

        expect(global.ActiveEffect.createDocuments).toHaveBeenCalledTimes(1)
    })
})
