import { jest } from '@jest/globals'
import {
    registerBallisticResolution,
    resolveBallisticDefenseOutcome,
} from '../ballistic-spell-resolution.js'

describe('ballistic spell resolution', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.game = { user: { id: 'caster-user' }, socket: { emit: jest.fn() } }
    })

    test('consumes a matching ballistic defense outcome once on the initiating client', async () => {
        const onResolved = jest.fn().mockResolvedValue()
        registerBallisticResolution({
            resolutionId: 'ballistic-target-1',
            initiatorUserId: 'caster-user',
            onResolved,
        })
        const outcome = {
            resolutionId: 'ballistic-target-1',
            initiatorUserId: 'caster-user',
            defended: false,
        }

        await expect(resolveBallisticDefenseOutcome(outcome)).resolves.toBe(true)
        await expect(resolveBallisticDefenseOutcome(outcome)).resolves.toBe(false)
        expect(onResolved).toHaveBeenCalledTimes(1)
        expect(onResolved).toHaveBeenCalledWith(outcome)
    })

    test("does not consume another caster client's outcome", async () => {
        const onResolved = jest.fn()
        registerBallisticResolution({
            resolutionId: 'ballistic-target-2',
            initiatorUserId: 'other-user',
            onResolved,
        })

        await expect(
            resolveBallisticDefenseOutcome({
                resolutionId: 'ballistic-target-2',
                initiatorUserId: 'other-user',
                defended: true,
            }),
        ).resolves.toBe(false)
        expect(onResolved).not.toHaveBeenCalled()
    })
})
