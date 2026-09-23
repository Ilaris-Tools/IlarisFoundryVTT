import { jest } from '@jest/globals'

describe('target Magieresistenz chat routing', () => {
    let applyMagicResistanceResultToDialog
    let handleMagicResistanceRequest

    beforeAll(async () => {
        ;({ applyMagicResistanceResultToDialog, handleMagicResistanceRequest } =
            await import('../magic-resistance-chat.js'))
    })

    beforeEach(() => {
        global.window = { _ilarisCombatDialogs: new Map() }
        global.game = {
            user: { id: 'target-user' },
            users: [
                { id: 'target-user', active: true, isGM: false },
                { id: 'gm-user', active: true, isGM: true },
            ],
        }
        global.ChatMessage = { create: jest.fn().mockResolvedValue({}) }
    })

    test('creates exactly one request card on the designated target controller', async () => {
        const request = {
            id: 'request-1',
            dialogId: 'dialog-1',
            executorUserId: 'target-user',
            targetName: 'Ziel',
            magicResistance: 8,
        }

        await handleMagicResistanceRequest(request)
        await handleMagicResistanceRequest(request)

        expect(ChatMessage.create).toHaveBeenCalledTimes(1)
        expect(ChatMessage.create).toHaveBeenCalledWith(
            expect.objectContaining({
                whisper: ['target-user', 'gm-user'],
                flags: { ilaris: { magicResistanceRequest: true, requestId: 'request-1' } },
            }),
        )
    })

    test('updates only a matching open caster dialog once', () => {
        const dialog = {
            magicResistanceChallenge: {
                id: 'request-2',
                dialogId: 'dialog-2',
                targetActorUuid: 'Actor.target',
                magicResistance: 6,
                d20: null,
                difficulty: null,
            },
            render: jest.fn(),
        }
        window._ilarisCombatDialogs.set('dialog-2', dialog)

        expect(
            applyMagicResistanceResultToDialog({
                requestId: 'request-2',
                dialogId: 'dialog-2',
                targetActorUuid: 'Actor.target',
                d20: 13,
            }),
        ).toBe(true)
        expect(dialog.magicResistanceChallenge).toMatchObject({ d20: 13, difficulty: 19 })
        expect(dialog.render).toHaveBeenCalledTimes(1)
        expect(
            applyMagicResistanceResultToDialog({
                requestId: 'request-2',
                dialogId: 'dialog-2',
                targetActorUuid: 'Actor.target',
                d20: 7,
            }),
        ).toBe(false)
    })
})
