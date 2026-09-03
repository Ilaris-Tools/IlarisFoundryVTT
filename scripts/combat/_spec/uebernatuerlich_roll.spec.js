import { jest } from '@jest/globals'
import { resolveBallisticDefenseOutcome } from '../ballistic-spell-resolution.js'

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
                warn: jest.fn(),
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
        dialog.updateManoeverMods.mockImplementation(async () => {
            dialog.maechtigeMagieQs = 2
            dialog.maneuverDurationBonus = 3
        })
        dialog.refreshActorData = jest.fn().mockImplementation(async () => {
            dialog.maechtigeMagieQs = 0
            dialog.maneuverDurationBonus = 0
        })
        dialog._resolveSuccessfulSpellEffects = jest.fn().mockResolvedValue()

        await dialog._angreifenKlick()

        expect(mockRoll.toMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                speaker: { alias: 'Caster' },
                flavor: '<h3>Kritischer Erfolg</h3>',
            }),
            { messageMode: false },
        )
        expect(dialog.applyEnergyCost).toHaveBeenCalledWith(true, true)
        expect(dialog._resolveSuccessfulSpellEffects).toHaveBeenCalledWith(expect.any(Object))
        expect(dialog.maechtigeMagieQs).toBe(2)
        expect(dialog.maneuverDurationBonus).toBe(3)
    })

    test('holds an automatic MR cast until the selected target supplies its D20', async () => {
        const targetActor = {
            id: 'target',
            uuid: 'Actor.target',
            name: 'Ziel',
            type: 'held',
            system: { abgeleitete: { mr: 8 } },
        }
        global.game.settings.get.mockImplementation((scope, key) => {
            if (scope === 'Ilaris' && key === 'useTargetSelection') return true
            return false
        })
        global.game.actors = { get: jest.fn().mockReturnValue(targetActor) }
        global.canvas = { tokens: { get: jest.fn().mockReturnValue(null) } }

        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.item = { system: { schwierigkeit: 'Magieresistenz' } }
        dialog.selectedActors = [{ actorId: 'target' }]
        dialog.magicResistanceChallenge = null
        dialog.getEffectiveSpellProfile = () => ({
            difficulty: 0,
            magicResistance: { enabled: true },
        })

        expect(dialog._getMagicResistanceTemplateContext()).toMatchObject({
            status: 'pending',
            targetName: 'Ziel',
            magicResistance: 8,
        })
        expect(dialog._getCastingDifficulty()).toBeNull()
        expect(dialog._isMagicResistancePending()).toBe(true)

        dialog._isMagicResistancePending = jest.fn().mockReturnValue(true)
        await dialog._angreifenKlick()
        expect(ui.notifications.warn).toHaveBeenCalledWith(
            'Fordere zuerst den W20 für die Magieresistenz an.',
        )
        expect(mockRoll.toMessage).not.toHaveBeenCalled()

        dialog.magicResistanceChallenge = {
            targetActorUuid: targetActor.uuid,
            magicResistance: 8,
            d20: 13,
            difficulty: 21,
        }
        dialog._isMagicResistancePending = UebernatuerlichDialog.prototype._isMagicResistancePending
        expect(dialog._getCastingDifficulty()).toBe(21)
        expect(dialog._getMagicResistanceTemplateContext()).toMatchObject({
            status: 'resolved',
            d20: 13,
            difficulty: 21,
        })
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

    test('does not render a selectable creature source for a fixed creature summon', async () => {
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.summonCreatureSelections = new Map()
        dialog.getEffectiveSpellModificationContext = () => ({
            preEffects: [
                {
                    summonCreature: {
                        enabled: true,
                        sourceUuid: 'Compendium.Ilaris.kreaturen.Actor.Kraehenschwarm1',
                    },
                },
            ],
        })

        await expect(dialog._getSummonCreatureSelectors()).resolves.toEqual([])
        expect(dialog.summonCreatureSelections.size).toBe(0)
    })

    test('applies a ballistic spell to its selected target without requiring a caster token after an undefended outcome', async () => {
        global.game.user = { id: 'caster-user', targets: new Set() }
        global.foundry.utils.randomID = jest
            .fn()
            .mockReturnValueOnce('defended-target')
            .mockReturnValueOnce('undefended-target')
        global.canvas = {
            tokens: {
                get: jest.fn().mockReturnValue({ center: { x: 200, y: 100 }, document: {} }),
            },
        }
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.actor = { id: 'caster' }
        dialog.item = { name: 'Ignifaxius' }
        dialog.speaker = {}
        dialog.armedInputValues = {}
        dialog.getSelectedSpellModificationId = () => ''
        dialog.getEffectiveSpellModificationContext = () => ({
            profile: { ballistic: { enabled: true } },
            preEffects: [{ instant: true }],
        })
        dialog._postBallisticOutcome = jest.fn().mockResolvedValue()
        dialog._applyBallisticPreEffects = jest.fn().mockResolvedValue()
        const target = { actorId: 'target', tokenId: 'target-token', name: 'Ziel' }

        const defendedRoll = dialog.createBallisticTargetRoll({ success: true }, target)
        await resolveBallisticDefenseOutcome({
            ...defendedRoll.ilarisBallisticSpell,
            defended: true,
        })
        expect(dialog._applyBallisticPreEffects).not.toHaveBeenCalled()

        const undefendedRoll = dialog.createBallisticTargetRoll({ success: true }, target)
        await resolveBallisticDefenseOutcome({
            ...undefendedRoll.ilarisBallisticSpell,
            defended: false,
        })
        expect(dialog._applyBallisticPreEffects).toHaveBeenCalledWith(
            expect.objectContaining({ success: true }),
            expect.objectContaining({ targets: [target], applicationId: 'undefended-target' }),
        )
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

    test('requires a placed zone only when target automation and a zone profile are both active', async () => {
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.getEffectiveSpellModificationContext = () => ({ zone: { shape: 'cone' } })
        dialog.zonePlacement = null

        global.game.settings.get.mockReturnValue(true)
        expect(dialog._isZonePlacementMissing()).toBe(true)
        await expect(dialog._requireZonePlacement()).resolves.toBe(false)
        expect(ui.notifications.warn).toHaveBeenCalledWith('Platziere zuerst die Zone.')

        global.game.settings.get.mockReturnValue(false)
        expect(dialog._isZonePlacementMissing()).toBe(false)
        await expect(dialog._requireZonePlacement()).resolves.toBe(true)
    })

    test('does not require placement for a selected non-zone spell form', () => {
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.getEffectiveSpellModificationContext = () => ({ zone: null })
        dialog.zonePlacement = null
        global.game.settings.get.mockReturnValue(true)

        expect(dialog._hasZonePlacementRequirement()).toBe(false)
        expect(dialog._isZonePlacementMissing()).toBe(false)
    })

    test('cleans up a player-owned draft through the GM socket when placement is cancelled', async () => {
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.zonePlacement = { draftId: 'zone-draft' }
        dialog.dialogId = 'zone-dialog'
        dialog.zoneCasterTokenId = 'caster-token'
        global.canvas = { scene: { id: 'scene-id' } }
        global.game.user = { id: 'player-id', isGM: false }
        global.game.socket = { emit: jest.fn() }

        await expect(dialog._discardZoneDraft()).resolves.toBe(true)

        expect(game.socket.emit).toHaveBeenCalledWith('system.Ilaris', {
            type: 'deleteZoneDraft',
            data: {
                sceneId: 'scene-id',
                draftId: 'zone-draft',
                ownerUserId: 'player-id',
                dialogId: 'zone-dialog',
            },
        })
        expect(dialog.zonePlacement).toBeNull()
        expect(dialog.zoneCasterTokenId).toBe('')
    })

    test('discards a prior draft and reports when a zone caster token is unavailable', async () => {
        const dialog = Object.create(UebernatuerlichDialog.prototype)
        dialog.manoeverAuswaehlen = jest.fn().mockResolvedValue(true)
        dialog.updateManoeverMods = jest.fn().mockResolvedValue()
        dialog._discardZoneDraft = jest.fn().mockResolvedValue(true)
        dialog.getEffectiveSpellModificationContext = () => ({ zone: { shape: 'cone' } })
        global.game.settings.get.mockReturnValue(true)
        global.canvas = { scene: { id: 'scene-id' }, tokens: { placeables: [] } }

        await dialog._placeZone()

        expect(dialog._discardZoneDraft).toHaveBeenCalledTimes(1)
        expect(ui.notifications.error).toHaveBeenCalledWith(
            'Zonenplatzierung benötigt eine aktive Szene und einen Zauberer-Token.',
        )
    })
})
