import { roll_crit_message } from '../wuerfel_misc.js';
import { jest } from '@jest/globals';

describe('roll_crit_message', () => {
    let mockRoll;
    let mockChatMessage;

    beforeEach(() => {
        // Mock Roll class
        global.Roll = jest.fn().mockImplementation(() => mockRoll);
        
        // Mock ChatMessage.create
        global.ChatMessage = {
            create: jest.fn().mockImplementation((data) => {
                mockChatMessage = data;
                return Promise.resolve(data);
            })
        };

        // Mock game settings - default to false for realFumbleCrits
        global.game = {
            settings: {
                get: jest.fn().mockReturnValue(false) // realFumbleCrits default to true
            }
        };

        // Mock renderTemplate function
        global.renderTemplate = jest.fn().mockImplementation((path, data) => {
            // Return a simple HTML string based on the template data
            if (data.crit) return '<h3>Kritischer Erfolg</h3>';
            if (data.fumble) return '<h3>Patzer</h3>';
            if (data.success) return '<h3>Erfolg</h3>';
            if (data.noSuccess) return '<h3>Misserfolg</h3>';
            return '<div>Default Template</div>';
        });

        // Default mock roll behavior
        mockRoll = {
            evaluate: jest.fn().mockResolvedValue({ _total: 15 }),
            dice: [{
                results: [{ active: true, result: 10 }]
            }],
            toMessage: jest.fn().mockResolvedValue({})
        };
    });

    test('should identify critical success on natural 20 with success_val', async () => {
        mockRoll.dice[0].results[0].result = 20;
        mockRoll.evaluate.mockResolvedValue({ _total: 25 });

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ crit: true })
        );
    });

    test('should not identify critical success on natural 20 if target number is too high', async () => {
        mockRoll.dice[0].results[0].result = 20;
        const bonuses = 5;
        mockRoll.evaluate.mockResolvedValue({ _total: 25 }); // 20 + 5 bonuses

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 30); // Target number higher than possible

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.not.objectContaining({ crit: true })
        );
    });

    test('should identify fumble on roll <= fumble_val if target number is high enough', async () => {
        mockRoll.dice[0].results[0].result = 1;
        const bonuses = 5;
        mockRoll.evaluate.mockResolvedValue({ _total: 6 }); // 1 + 5 bonuses

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ fumble: true })
        );
    });

    test('should not identify fumble if target number is too low', async () => {
        mockRoll.dice[0].results[0].result = 1;
        const bonuses = 15;
        mockRoll.evaluate.mockResolvedValue({ _total: 16 }); // 1 + 15 bonuses

        await roll_crit_message('1d20+15', 'Test Roll', '', null, 'roll', true, 1, 5); // Target number lower than minimum possible

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.not.objectContaining({ fumble: true })
        );
    });

    test('should handle normal success with success_val', async () => {
        mockRoll.dice[0].results[0].result = 15;
        mockRoll.evaluate.mockResolvedValue({ _total: 20 });

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ success: true })
        );
    });

    test('should handle normal failure with success_val', async () => {
        mockRoll.dice[0].results[0].result = 10;
        mockRoll.evaluate.mockResolvedValue({ _total: 12 });

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 15);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ noSuccess: true })
        );
    });

    test('should handle disabled crit evaluation', async () => {
        mockRoll.dice[0].results[0].result = 20;
        mockRoll.evaluate.mockResolvedValue({ _total: 25 });

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', false);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.not.objectContaining({ crit: true })
        );
    });

    test('should use realFumbleCrits when enabled', async () => {
        // Enable realFumbleCrits for this test only
        game.settings.get.mockReturnValue(true);

        mockRoll.dice[0].results[0].result = 20;
        mockRoll.evaluate.mockResolvedValue({ _total: 25 });

        await roll_crit_message('1d20+5', 'Test Roll', '', null, 'roll', true, 1, 30); // Even with impossible target

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/probenchat_profan.html',
            expect.objectContaining({ crit: true })
        );
    });

    test('should use spell_result template for spell rolls', async () => {
        mockRoll.dice[0].results[0].result = 15;
        mockRoll.evaluate.mockResolvedValue({ _total: 20 });

        await roll_crit_message('1d20+5', 'Zauber (Feuerball)', 'Kosten: 15 AsP', null, 'roll', true, 1, 15);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            'systems/Ilaris/templates/chat/spell_result.html',
            expect.objectContaining({
                success: true,
                cost: '15',
                costModifier: 2
            })
        );
    });
});
