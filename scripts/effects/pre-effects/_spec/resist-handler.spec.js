const effectCreate = jest.fn().mockResolvedValue([])
let hookCallbacks

jest.mock('../../../skills/skills-api.js', () => ({
    openSkillDialog: jest.fn().mockResolvedValue({}),
}))

import {
    registerResistHandler,
    registerResistResolutionListener,
    resolveInitialResistTalent,
} from '../resist-handler.js'

const mockOpenSkillDialog = jest.requireMock('../../../skills/skills-api.js').openSkillDialog

function preEffect(overrides = {}) {
    return {
        targetActorId: 'target',
        casterUuid: 'Actor.caster',
        spellUuid: 'Item.spell',
        baseDuration: 3,
        maneuverBonus: 1,
        isSelfCast: false,
        instant: false,
        changes: [{ key: 'system.test', type: 'add', value: '5', diminishedValue: '2' }],
        avoidTest: { diminishedOnly: false },
        ...overrides,
    }
}

beforeEach(() => {
    hookCallbacks = {}
    global.window = {}
    global.Hooks.on = jest.fn((event, callback) => {
        hookCallbacks[event] = callback
    })
    global.ActiveEffect.createDocuments = effectCreate
    effectCreate.mockClear()
    global.ChatMessage = {
        create: jest.fn().mockResolvedValue(undefined),
        getSpeaker: jest.fn(() => ({ alias: 'Target' })),
    }
    global.game = {
        actors: {
            get: jest.fn((id) =>
                id === 'target'
                    ? { id: 'target', name: 'Target', system: {}, update: jest.fn() }
                    : null,
            ),
        },
        users: [],
    }
    global.foundry.utils.fromUuid = jest.fn((uuid) => {
        if (uuid === 'Item.spell') return { name: 'Spell', uuid, system: {} }
        if (uuid === 'Actor.caster') return { uuid }
        return null
    })
    mockOpenSkillDialog.mockClear()
    mockOpenSkillDialog.mockResolvedValue({})
})

describe('resist result listener', () => {
    it('applies a full non-instant effect when the resist roll fails', async () => {
        registerResistResolutionListener()
        const dialog = { _resistContext: { preEffectData: preEffect(), spellUuid: 'Item.spell' } }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '5' })] })],
            expect.any(Object),
        )
        expect(dialog._resistContext).toBeUndefined()
    })

    it('does not apply an effect when the resist roll succeeds normally', async () => {
        registerResistResolutionListener()
        const dialog = { _resistContext: { preEffectData: preEffect(), spellUuid: 'Item.spell' } }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).not.toHaveBeenCalled()
    })

    it('applies diminished values when a diminished resist succeeds', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({ avoidTest: { diminishedOnly: true } }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '2' })] })],
            expect.any(Object),
        )
    })

    it('keeps the zero-value marker when a diminished-only resist fails', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    changes: [
                        {
                            key: 'system.modifikatoren.manuellermod',
                            type: 'add',
                            value: '0',
                            diminishedValue: '-4',
                        },
                    ],
                    avoidTest: { diminishedOnly: true },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: false } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '0' })] })],
            expect.any(Object),
        )
    })

    it('uses the diminished global modifier when a diminished-only resist succeeds', async () => {
        registerResistResolutionListener()
        const dialog = {
            _resistContext: {
                preEffectData: preEffect({
                    changes: [
                        {
                            key: 'system.modifikatoren.manuellermod',
                            type: 'add',
                            value: '0',
                            diminishedValue: '-4',
                        },
                    ],
                    avoidTest: { diminishedOnly: true },
                }),
                spellUuid: 'Item.spell',
            },
        }

        await hookCallbacks['Ilaris.postSkillRoll'](dialog, { rollResult: { success: true } })

        expect(effectCreate).toHaveBeenCalledWith(
            [expect.objectContaining({ changes: [expect.objectContaining({ value: '-4' })] })],
            expect.any(Object),
        )
    })

    it('warns and re-enables the prompt button when the target actor is missing', async () => {
        global.ui = { notifications: { warn: jest.fn() } }
        global.game.actors.get.mockReturnValue(null)
        registerResistHandler()
        const button = {
            dataset: { actorId: 'missing', preEffectData: encodeURIComponent(JSON.stringify({})) },
            disabled: false,
            addEventListener: jest.fn((_, callback) => {
                button.clickHandler = callback
            }),
        }
        const htmlDOM = {
            querySelectorAll: jest.fn(() => [button]),
            closest: jest.fn(() => ({ classList: { remove: jest.fn(), add: jest.fn() } })),
        }

        hookCallbacks.renderChatMessageHTML({}, htmlDOM)
        await button.clickHandler.call(button)

        expect(global.ui.notifications.warn).toHaveBeenCalled()
        expect(button.disabled).toBe(false)
    })
})

describe('resolveInitialResistTalent', () => {
    it('keeps a configured talent owned by the resolved profane skill', () => {
        expect(
            resolveInitialResistTalent([{ name: 'Akrobatik' }, { name: 'Laufen' }], 'Akrobatik'),
        ).toBe('Akrobatik')
    })

    it('falls back to no talent when the target does not own the configured talent', () => {
        expect(resolveInitialResistTalent([{ name: 'Laufen' }], 'Akrobatik')).toBe('')
    })
})

describe('skill-based resist dialog', () => {
    it('forwards the matched skill Item ID and retains an owned configured talent', async () => {
        global.ui = { notifications: { warn: jest.fn() } }
        const skill = {
            id: 'athletik-id',
            name: 'Athletik',
            system: { pw: 10, talente: [{ name: 'Akrobatik' }] },
        }
        const actor = {
            id: 'target',
            name: 'Target',
            system: {},
            profan: { fertigkeiten: [skill] },
        }
        global.game.actors.get.mockReturnValue(actor)
        registerResistHandler()

        const button = {
            dataset: {
                actorId: 'target',
                preEffectData: encodeURIComponent(
                    JSON.stringify({
                        eventId: 'event-1',
                        spellUuid: 'Item.spell',
                        spellName: 'Ignifaxius',
                        avoidTest: {
                            fertigkeit: 'Athletik',
                            talent: 'Akrobatik',
                            resistDifficulty: 12,
                        },
                    }),
                ),
            },
            disabled: false,
            addEventListener: jest.fn((_, callback) => {
                button.clickHandler = callback
            }),
        }
        const htmlDOM = {
            querySelectorAll: jest.fn(() => [button]),
            closest: jest.fn(() => ({ classList: { remove: jest.fn(), add: jest.fn() } })),
        }

        hookCallbacks.renderChatMessageHTML({}, htmlDOM)
        await button.clickHandler.call(button)

        expect(mockOpenSkillDialog).toHaveBeenCalledWith(
            actor,
            expect.objectContaining({
                probeType: 'fertigkeit',
                fertigkeitKey: 'athletik-id',
                pw: 10,
                talentList: { 0: 'Akrobatik' },
                initialTalent: 'Akrobatik',
            }),
        )
    })

    it('forwards the skill Item ID and falls back to no talent when unowned', async () => {
        global.ui = { notifications: { warn: jest.fn() } }
        const skill = {
            id: 'athletik-id',
            name: 'Athletik',
            system: { pw: 10, talente: [{ name: 'Laufen' }] },
        }
        const actor = {
            id: 'target',
            name: 'Target',
            system: {},
            profan: { fertigkeiten: [skill] },
        }
        global.game.actors.get.mockReturnValue(actor)
        registerResistHandler()

        const button = {
            dataset: {
                actorId: 'target',
                preEffectData: encodeURIComponent(
                    JSON.stringify({
                        eventId: 'event-1',
                        avoidTest: {
                            fertigkeit: 'Athletik',
                            talent: 'Akrobatik',
                            resistDifficulty: 12,
                        },
                    }),
                ),
            },
            disabled: false,
            addEventListener: jest.fn((_, callback) => {
                button.clickHandler = callback
            }),
        }
        const htmlDOM = {
            querySelectorAll: jest.fn(() => [button]),
            closest: jest.fn(() => ({ classList: { remove: jest.fn(), add: jest.fn() } })),
        }

        hookCallbacks.renderChatMessageHTML({}, htmlDOM)
        await button.clickHandler.call(button)

        expect(mockOpenSkillDialog).toHaveBeenCalledWith(
            actor,
            expect.objectContaining({ fertigkeitKey: 'athletik-id', initialTalent: '' }),
        )
        expect(global.ui.notifications.warn).not.toHaveBeenCalled()
    })
})
