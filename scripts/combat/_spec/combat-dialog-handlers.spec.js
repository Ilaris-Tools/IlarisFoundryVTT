import { jest } from '@jest/globals'

describe('combat dialog defense prompt handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.window = {}
        global.canvas = { tokens: { get: jest.fn().mockReturnValue(null) } }
        global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } }
        global.foundry.utils.randomID = jest.fn().mockReturnValue('defense-event')
        global.ChatMessage = {
            create: jest.fn().mockResolvedValue({}),
            getWhisperRecipients: jest.fn().mockReturnValue(['gm-user']),
        }
        global.game = {
            settings: { get: jest.fn().mockReturnValue(true) },
            user: { id: 'gm-user', isGM: true },
            users: [{ id: 'gm-user', active: true, isGM: true }],
            actors: { get: jest.fn() },
            socket: { emit: jest.fn() },
        }
        global.Hooks = {
            call: jest.fn().mockReturnValue(true),
            callAll: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
            off: jest.fn(),
        }
    })

    test('adds an owner-routed Nicht verteidigen outcome only for ballistic ranged prompts', async () => {
        const targetActor = {
            id: 'target-actor',
            name: 'Target',
            type: 'held',
            items: [],
            canUserModify: jest.fn().mockReturnValue(true),
            testUserPermission: jest.fn().mockReturnValue(true),
        }
        game.actors.get.mockReturnValue(targetActor)
        const { registerCombatDialogHandlers } = await import('../hooks/combat_dialog_handlers.js')
        registerCombatDialogHandlers()
        const handler = Hooks.on.mock.calls.find(([name]) => name === 'Ilaris.postAngriff')[1]
        const dialog = {
            attackType: 'ranged',
            actor: { id: 'caster', name: 'Caster' },
            item: { name: 'Ignifaxius' },
            selectedActors: [{ actorId: 'target-actor', tokenId: 'target-token', name: 'Target' }],
            createBallisticTargetRoll: jest.fn().mockReturnValue({
                roll: { total: 18 },
                success: true,
                ilarisBallisticSpell: {
                    resolutionId: 'resolution-1',
                    initiatorUserId: 'caster-user',
                },
            }),
        }

        await handler({ roll: { total: 18 }, success: true }, dialog)

        expect(dialog.createBallisticTargetRoll).toHaveBeenCalledWith(
            expect.objectContaining({ success: true }),
            dialog.selectedActors[0],
        )
        expect(ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('Nicht verteidigen'),
            }),
        )
    })
})
