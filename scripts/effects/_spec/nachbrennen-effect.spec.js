import {
    addPendingNachbrennen,
    completeNachbrennen,
    requestNachbrennenCountercheck,
    registerNachbrennenEffect,
    resolveElementalSideEffect,
} from '../nachbrennen-effect.js'

jest.mock('../../skills/skills-api.js', () => ({ openSkillDialog: jest.fn() }))

import { openSkillDialog } from '../../skills/skills-api.js'

beforeEach(() => {
    global.foundry = {
        utils: {
            deepClone: (value) => JSON.parse(JSON.stringify(value)),
            randomID: () => 'nachbrennen-source',
        },
    }
    global.ChatMessage = {
        create: jest.fn().mockResolvedValue(undefined),
        getSpeaker: jest.fn(() => ({ actor: 'target' })),
    }
    global.CONST = { CHAT_MESSAGE_STYLES: { OTHER: 0 } }
    global.ui = { notifications: { warn: jest.fn() } }
    global.Hooks = { on: jest.fn() }
    global.window = {}
    global.CONFIG = {
        ILARIS: { label: { KO: 'Konstitution' } },
        statusEffects: { Nachbrennen: { id: 'Nachbrennen', name: 'Nachbrennen' } },
    }
    global.ActiveEffect = { createDocuments: jest.fn().mockResolvedValue([]) }
    openSkillDialog.mockReset()
})

function createActor(overrides = {}) {
    return {
        id: 'target',
        uuid: 'Actor.target',
        name: 'Ziel',
        system: { attribute: { KO: { pw: 14 } }, gesundheit: { wunden: 2 } },
        effects: [],
        update: jest.fn().mockResolvedValue(undefined),
        deleteEmbeddedDocuments: jest.fn().mockResolvedValue([]),
        ...overrides,
    }
}

describe('Nachbrennen countercheck', () => {
    it('opens a KO-20 attribute countercheck and retains its target context', async () => {
        const actor = createActor()
        const dialog = {}
        openSkillDialog.mockResolvedValue(dialog)

        await requestNachbrennenCountercheck(actor)

        expect(openSkillDialog).toHaveBeenCalledWith(
            actor,
            expect.objectContaining({
                probeType: 'attribut',
                fertigkeitKey: 'KO',
                pw: 14,
                success_val: 20,
                resistAgainst: 'Nachbrennen',
            }),
        )
        expect(dialog._nachbrennenContext).toEqual(
            expect.objectContaining({ targetActor: actor, sourceId: 'nachbrennen-source' }),
        )
    })

    it('creates a visible four-owner-phase condition source after a failed countercheck', async () => {
        const actor = createActor()

        await addPendingNachbrennen(actor, 'source-1')

        expect(ActiveEffect.createDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    statuses: ['Nachbrennen'],
                    system: expect.objectContaining({
                        ilarisCondition: expect.objectContaining({
                            sources: [
                                expect.objectContaining({
                                    id: 'source-1',
                                    type: 'nachbrennen',
                                    timing: {
                                        durationType: 'ownerTurns',
                                        expiresOn: 'turnStart',
                                        remaining: 4,
                                    },
                                }),
                            ],
                        }),
                    }),
                }),
            ],
            { parent: actor },
        )
    })

    it('dispatches the configured Nachbrennen name and leaves an unknown name inert', async () => {
        const actor = createActor()
        openSkillDialog.mockResolvedValue({})
        const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})

        await resolveElementalSideEffect(actor, 'nachbrennen')
        await resolveElementalSideEffect(actor, 'unbekannt')

        expect(openSkillDialog).toHaveBeenCalledTimes(1)
        expect(warning).toHaveBeenCalledWith(
            'Ilaris | Unbekannter elementarer Nebeneffekt: unbekannt',
        )
        warning.mockRestore()
    })

    it('does not create a pending source when the KO countercheck succeeds', async () => {
        const actor = createActor()
        registerNachbrennenEffect()
        const callback = Hooks.on.mock.calls.find(([event]) => event === 'Ilaris.postSkillRoll')[1]

        await callback(
            { _nachbrennenContext: { targetActor: actor, sourceId: 'source-success' } },
            { rollResult: { success: true } },
        )

        expect(ActiveEffect.createDocuments).not.toHaveBeenCalled()
    })
})

describe('Nachbrennen completion', () => {
    it('adds exactly one wound and reports completion', async () => {
        const actor = createActor()

        await completeNachbrennen(actor)

        expect(actor.update).toHaveBeenCalledWith({ 'system.gesundheit.wunden': 3 })
        expect(ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('Nachbrennen'),
                speaker: { actor: 'target' },
            }),
        )
    })
})
