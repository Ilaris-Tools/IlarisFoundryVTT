import { roll_crit_message } from '../wuerfel_misc.js'
import { jest } from '@jest/globals'

describe('roll_crit_message', () => {
    let mockRoll
    let mockChatMessage

    beforeEach(() => {
        // Mock Roll class
        global.Roll = jest.fn().mockImplementation(() => mockRoll)

        // Mock ChatMessage.create
        global.ChatMessage = {
            create: jest.fn().mockImplementation((data) => {
                mockChatMessage = data
                return Promise.resolve(data)
            }),
        }

        // Mock game settings - default to false for realFumbleCrits
        global.game = {
            settings: {
                get: jest.fn().mockReturnValue(false),
            },
        }

        // Mock renderTemplate function
        global.renderTemplate = jest.fn().mockImplementation((path, data) => {
            // Return a simple HTML string based on the template data
            if (data.crit) return '<h3>Kritischer Erfolg</h3>'
            if (data.fumble) return '<h3>Patzer</h3>'
            if (data.success) return '<h3>Erfolg</h3>'
            if (data.noSuccess) return '<h3>Misserfolg</h3>'
            return '<div>Default Template</div>'
        })

        // Default mock roll behavior
        mockRoll = {
            evaluate: jest.fn().mockResolvedValue({ _total: 15 }),
            dice: [
                {
                    results: [{ active: true, result: 10 }],
                },
            ],
            toMessage: jest.fn().mockResolvedValue({}),
        }
    })

    describe('with realFumbleCrits disabled (default)', () => {
        test('should identify critical success on natural 20 when total meets success_val', async () => {
            mockRoll.dice[0].results[0].result = 20
            mockRoll.evaluate.mockResolvedValue({ _total: 25 }) // 20 + 5 bonuses

            await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 20)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.html',
                expect.objectContaining({ crit: true }),
            )
        })

        test('should not identify critical success when total cannot meet success_val', async () => {
            mockRoll.dice[0].results[0].result = 20
            mockRoll.evaluate.mockResolvedValue({ _total: 25 }) // 20 + 5 bonuses

            await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 30)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.html',
                expect.not.objectContaining({ crit: true }),
            )
        })

        test('should identify fumble when total would fail success_val', async () => {
            mockRoll.dice[0].results[0].result = 1
            mockRoll.evaluate.mockResolvedValue({ _total: 6 }) // 1 + 5 bonuses

            await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.html',
                expect.objectContaining({ fumble: true }),
            )
        })

        test('should not identify fumble when total would still meet success_val', async () => {
            mockRoll.dice[0].results[0].result = 1
            mockRoll.evaluate.mockResolvedValue({ _total: 16 }) // 1 + 15 bonuses

            await roll_crit_message('1d20+15', 'Test Roll', '', null, 'roll', true, 1, 5)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.html',
                expect.not.objectContaining({ fumble: true }),
            )
        })
    })

    describe('with realFumbleCrits enabled', () => {
        beforeEach(() => {
            game.settings.get.mockReturnValue(true)
        })

        test('should always identify critical success on natural 20', async () => {
            mockRoll.dice[0].results[0].result = 20
            mockRoll.evaluate.mockResolvedValue({ _total: 25 }) // 20 + 5 bonuses

            await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 30) // Impossible target

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.html',
                expect.objectContaining({ crit: true }),
            )
        })

        test('should always identify fumble on fumble value', async () => {
            mockRoll.dice[0].results[0].result = 1
            mockRoll.evaluate.mockResolvedValue({ _total: 16 }) // 1 + 15 bonuses

            await roll_crit_message('1d20+15', 'Test Roll', '', null, 'roll', true, 1, 5) // Easy target

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.html',
                expect.objectContaining({ fumble: true }),
            )
        })
    })

    test('should handle normal success with success_val', async () => {
        mockRoll.dice[0].results[0].result = 15
        mockRoll.evaluate.mockResolvedValue({ _total: 20 })

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15)

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ success: true }),
        )
    })

    test('should handle normal failure with success_val', async () => {
        mockRoll.dice[0].results[0].result = 10
        mockRoll.evaluate.mockResolvedValue({ _total: 12 })

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15)

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ noSuccess: true }),
        )
    })

    test('should handle disabled crit evaluation', async () => {
        mockRoll.dice[0].results[0].result = 20
        mockRoll.evaluate.mockResolvedValue({ _total: 25 })

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', false)

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.not.objectContaining({ crit: true }),
        )
    })

    test('should use spell_result template for spell rolls', async () => {
        mockRoll.dice[0].results[0].result = 15
        mockRoll.evaluate.mockResolvedValue({ _total: 20 })

        await roll_crit_message(
            '1d20+5',
            'Zauber (Feuerball)',
            'Kosten: 15 AsP',
            null,
            'roll',
            true,
            1,
            15,
        )

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/spell_result.html',
            expect.objectContaining({
                success: true,
                cost: '15',
                costModifier: 2,
            }),
        )
    })
})
