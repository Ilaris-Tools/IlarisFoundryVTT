import {
    roll_crit_message,
    evaluate_roll_with_crit,
    get_statuseffect_by_id,
    calculate_diceschips,
} from '../wuerfel_misc.js'
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
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                expect.objectContaining({ crit: true }),
            )
        })

        test('should not identify critical success when total cannot meet success_val', async () => {
            mockRoll.dice[0].results[0].result = 20
            mockRoll.evaluate.mockResolvedValue({ _total: 25 }) // 20 + 5 bonuses

            await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 30)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                expect.not.objectContaining({ crit: true }),
            )
        })

        test('should identify fumble when total would fail success_val', async () => {
            mockRoll.dice[0].results[0].result = 1
            mockRoll.evaluate.mockResolvedValue({ _total: 6 }) // 1 + 5 bonuses

            await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                expect.objectContaining({ fumble: true }),
            )
        })

        test('should not identify fumble when total would still meet success_val', async () => {
            mockRoll.dice[0].results[0].result = 1
            mockRoll.evaluate.mockResolvedValue({ _total: 16 }) // 1 + 15 bonuses

            await roll_crit_message('1d20+15', 'Test Roll', '', null, 'roll', true, 1, 5)

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
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
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                expect.objectContaining({ crit: true }),
            )
        })

        test('should always identify fumble on fumble value', async () => {
            mockRoll.dice[0].results[0].result = 1
            mockRoll.evaluate.mockResolvedValue({ _total: 16 }) // 1 + 15 bonuses

            await roll_crit_message('1d20+15', 'Test Roll', '', null, 'roll', true, 1, 5) // Easy target

            expect(global.renderTemplate).toHaveBeenCalledWith(
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                expect.objectContaining({ fumble: true }),
            )
        })
    })

    test('should handle normal success with success_val', async () => {
        mockRoll.dice[0].results[0].result = 15
        mockRoll.evaluate.mockResolvedValue({ _total: 20 })

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15)

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.hbs',
            expect.objectContaining({ success: true }),
        )
    })

    test('should handle normal failure with success_val', async () => {
        mockRoll.dice[0].results[0].result = 10
        mockRoll.evaluate.mockResolvedValue({ _total: 12 })

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15)

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.hbs',
            expect.objectContaining({ noSuccess: true }),
        )
    })

    test('should handle disabled crit evaluation', async () => {
        mockRoll.dice[0].results[0].result = 20
        mockRoll.evaluate.mockResolvedValue({ _total: 25 })

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', false)

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.hbs',
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
            'systems/Ilaris/templates/chat/spell_result.hbs',
            expect.objectContaining({
                success: true,
                cost: '15',
                costModifier: 2,
            }),
        )
    })
})

describe('evaluate_roll_with_crit', () => {
    let mockRoll

    beforeEach(() => {
        // Mock Roll class
        global.Roll = jest.fn().mockImplementation(() => mockRoll)

        // Mock game settings - default to false for realFumbleCrits
        global.game = {
            settings: {
                get: jest.fn().mockReturnValue(false),
            },
        }

        // Default mock roll behavior
        mockRoll = {
            evaluate: jest.fn().mockResolvedValue({ _total: 15 }),
            dice: [
                {
                    results: [{ active: true, result: 10 }],
                },
            ],
        }
    })

    test('should return success data with roll object', async () => {
        mockRoll.dice[0].results[0].result = 15
        mockRoll.evaluate.mockResolvedValue({ _total: 20 })

        const result = await evaluate_roll_with_crit('1d20+5', 'Test Roll', '', 15)

        expect(result).toEqual({
            success: true,
            is16OrHigher: false,
            crit: false,
            fumble: false,
            roll: mockRoll,
            templatePath: 'systems/Ilaris/templates/chat/probenchat_profan.hbs',
            templateData: expect.objectContaining({
                title: 'Test Roll',
                success: true,
            }),
        })
    })

    test('should identify critical success correctly', async () => {
        mockRoll.dice[0].results[0].result = 20
        mockRoll.evaluate.mockResolvedValue({ _total: 25 })

        const result = await evaluate_roll_with_crit('1d20+5', 'Test Roll', '', 20)

        expect(result.success).toBe(true)
        expect(result.crit).toBe(true)
        expect(result.fumble).toBe(false)
        expect(result.templateData.crit).toBe(true)
    })

    test('should identify fumble correctly', async () => {
        mockRoll.dice[0].results[0].result = 1
        mockRoll.evaluate.mockResolvedValue({ _total: 6 })

        const result = await evaluate_roll_with_crit('1d20+5', 'Test Roll', '', 15)

        expect(result.success).toBe(false)
        expect(result.crit).toBe(false)
        expect(result.fumble).toBe(true)
        expect(result.templateData.fumble).toBe(true)
    })

    test('should identify is16OrHigher flag', async () => {
        mockRoll.dice[0].results[0].result = 18
        mockRoll.evaluate.mockResolvedValue({ _total: 23 })

        const result = await evaluate_roll_with_crit('1d20+5', 'Test Roll', '', 15)

        expect(result.is16OrHigher).toBe(true)
    })

    test('should use spell_result template for spell rolls', async () => {
        mockRoll.dice[0].results[0].result = 15
        mockRoll.evaluate.mockResolvedValue({ _total: 20 })

        const result = await evaluate_roll_with_crit(
            '1d20+5',
            'Zauber (Feuerball)',
            'Kosten: 15 AsP',
            15,
        )

        expect(result.templatePath).toBe('systems/Ilaris/templates/chat/spell_result.hbs')
        expect(result.templateData).toEqual({
            success: true,
            cost: '15',
            costModifier: 2,
        })
    })

    test('should handle fumble with spell and increase cost modifier', async () => {
        mockRoll.dice[0].results[0].result = 1
        mockRoll.evaluate.mockResolvedValue({ _total: 6 })

        const result = await evaluate_roll_with_crit(
            '1d20+5',
            'Zauber (Feuerball)',
            'Kosten: 15 AsP',
            20,
        )

        expect(result.templateData.costModifier).toBe(4)
    })

    test('should handle disabled crit evaluation', async () => {
        mockRoll.dice[0].results[0].result = 20
        mockRoll.evaluate.mockResolvedValue({ _total: 25 })

        const result = await evaluate_roll_with_crit('1d20+5', 'Test Roll', '', 20, 1, false)

        expect(result.templateData.crit).toBe(false)
        expect(result.templateData.fumble).toBe(false)
    })
})

describe('get_statuseffect_by_id', () => {
    let mockActor

    beforeEach(() => {
        mockActor = {
            effects: {
                values: jest.fn(),
            },
        }
    })

    test('should return true when status effect is found', () => {
        const mockEffects = [
            { flags: { core: { statusId: 'prone' } } },
            { flags: { core: { statusId: 'bleeding' } } },
            { flags: { core: { statusId: 'stunned' } } },
        ]

        mockActor.effects.values.mockReturnValue(mockEffects[Symbol.iterator]())

        const result = get_statuseffect_by_id(mockActor, 'bleeding')

        expect(result).toBe(true)
    })

    test('should return false when status effect is not found', () => {
        const mockEffects = [
            { flags: { core: { statusId: 'prone' } } },
            { flags: { core: { statusId: 'bleeding' } } },
        ]

        mockActor.effects.values.mockReturnValue(mockEffects[Symbol.iterator]())

        const result = get_statuseffect_by_id(mockActor, 'stunned')

        expect(result).toBe(false)
    })

    test('should return false when actor has no effects', () => {
        const mockEffects = []

        mockActor.effects.values.mockReturnValue(mockEffects[Symbol.iterator]())

        const result = get_statuseffect_by_id(mockActor, 'prone')

        expect(result).toBe(false)
    })

    test('should check first effect in list', () => {
        const mockEffects = [{ flags: { core: { statusId: 'stunned' } } }]

        mockActor.effects.values.mockReturnValue(mockEffects[Symbol.iterator]())

        const result = get_statuseffect_by_id(mockActor, 'stunned')

        expect(result).toBe(true)
    })
})

describe('calculate_diceschips', () => {
    let mockHtml
    let mockActor

    beforeEach(() => {
        mockActor = {
            system: {
                schips: {
                    schips_stern: 3,
                },
            },
            update: jest.fn(),
        }

        mockHtml = {
            find: jest.fn(),
        }
    })

    test('should return base dice configuration when no options selected', () => {
        mockHtml.find.mockImplementation((selector) => {
            if (selector.includes('xd20')) {
                return [{ checked: true, value: '0' }]
            }
            if (selector.includes('schips')) {
                return [{ checked: false }]
            }
            return []
        })

        const [text, dice_number, discard_l, discard_h] = calculate_diceschips(
            mockHtml,
            'Test: ',
            mockActor,
        )

        expect(dice_number).toBe(1)
        expect(discard_l).toBe(0)
        expect(discard_h).toBe(0)
        expect(text).toBe('Test: ')
    })

    test('should configure 3d20 drop lowest and highest when xd20 is enabled', () => {
        mockHtml.find.mockImplementation((selector) => {
            if (selector.includes('xd20')) {
                return [
                    { checked: false, value: '0' },
                    { checked: true, value: '1' },
                ]
            }
            if (selector.includes('schips')) {
                return [{ checked: false }]
            }
            return []
        })

        const [, dice_number, discard_l, discard_h] = calculate_diceschips(
            mockHtml,
            'Test: ',
            mockActor,
        )

        expect(dice_number).toBe(3)
        expect(discard_l).toBe(1)
        expect(discard_h).toBe(1)
    })

    test('should add one die and drop lowest when using schips without trait', () => {
        mockHtml.find.mockImplementation((selector) => {
            if (selector.includes('xd20')) {
                return [{ checked: true, value: '0' }]
            }
            if (selector.includes('schips')) {
                return [
                    { checked: false, value: '0' },
                    { checked: true, value: '1' },
                ]
            }
            return []
        })

        const [text, dice_number, discard_l, discard_h] = calculate_diceschips(
            mockHtml,
            '',
            mockActor,
        )

        expect(dice_number).toBe(2)
        expect(discard_l).toBe(1)
        expect(discard_h).toBe(0)
        expect(text).toContain('Schips ohne Eigenheit')
        expect(mockActor.update).toHaveBeenCalledWith({
            system: {
                schips: {
                    schips_stern: 2,
                },
            },
        })
    })

    test('should add two dice and drop lowest two when using schips with trait', () => {
        mockHtml.find.mockImplementation((selector) => {
            if (selector.includes('xd20')) {
                return [{ checked: true, value: '0' }]
            }
            if (selector.includes('schips')) {
                return [
                    { checked: false, value: '0' },
                    { checked: false, value: '1' },
                    { checked: true, value: '2' },
                ]
            }
            return []
        })

        const [text, dice_number, discard_l, discard_h] = calculate_diceschips(
            mockHtml,
            '',
            mockActor,
        )

        expect(dice_number).toBe(3)
        expect(discard_l).toBe(2)
        expect(discard_h).toBe(0)
        expect(text).toContain('Schips mit Eigenschaft')
        expect(mockActor.update).toHaveBeenCalledWith({
            system: {
                schips: {
                    schips_stern: 2,
                },
            },
        })
    })

    test('should not consume schips when none available', () => {
        mockActor.system.schips.schips_stern = 0

        mockHtml.find.mockImplementation((selector) => {
            if (selector.includes('xd20')) {
                return [{ checked: true, value: '0' }]
            }
            if (selector.includes('schips')) {
                return [
                    { checked: false, value: '0' },
                    { checked: true, value: '1' },
                ]
            }
            return []
        })

        const [text, dice_number, discard_l] = calculate_diceschips(mockHtml, '', mockActor)

        expect(dice_number).toBe(1)
        expect(discard_l).toBe(0)
        expect(text).toContain('Keine Schips')
        expect(mockActor.update).not.toHaveBeenCalled()
    })

    test('should combine xd20 and schips correctly', () => {
        mockHtml.find.mockImplementation((selector) => {
            if (selector.includes('xd20')) {
                return [
                    { checked: false, value: '0' },
                    { checked: true, value: '1' },
                ]
            }
            if (selector.includes('schips')) {
                return [
                    { checked: false, value: '0' },
                    { checked: true, value: '1' },
                ]
            }
            return []
        })

        const [, dice_number, discard_l, discard_h] = calculate_diceschips(mockHtml, '', mockActor)

        expect(dice_number).toBe(4) // 3 from xd20 + 1 from schips
        expect(discard_l).toBe(2) // 1 from xd20 + 1 from schips
        expect(discard_h).toBe(1) // 1 from xd20
    })

    test('should handle custom dialogId for input names', () => {
        const dialogId = 'custom-123'

        mockHtml.find.mockImplementation((selector) => {
            expect(selector).toMatch(new RegExp(dialogId))
            if (selector.includes('xd20')) {
                return [{ checked: true, value: '0' }]
            }
            if (selector.includes('schips')) {
                return [{ checked: false }]
            }
            return []
        })

        calculate_diceschips(mockHtml, '', mockActor, dialogId)

        expect(mockHtml.find).toHaveBeenCalledWith(`input[name='xd20-${dialogId}']`)
        expect(mockHtml.find).toHaveBeenCalledWith(`input[name='schips-${dialogId}']`)
    })
})
