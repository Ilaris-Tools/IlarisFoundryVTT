import { processModification } from '../shared_dialog_helpers.js';

describe('processModification', () => {
    let rollValues;
    const mockSigned = jest.fn(value => (value >= 0 ? `+${value}` : `${value}`));
    const mockConfig = {
        ILARIS: {
            trefferzonen: {
                1: 'Head',
                2: 'Torso',
                3: 'Arm',
                4: 'Leg',
            },
        },
    };

    beforeEach(() => {
        rollValues = {
            mod_at: 0,
            mod_vt: 0,
            mod_dm: 0,
            text_at: '',
            text_vt: '',
            text_dm: '',
            schaden: '',
        };
        global.signed = mockSigned;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle ATTACK type with ADD operator', () => {
        const modification = { type: 'ATTACK', operator: 'ADD', value: 5 };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_at).toBe(10);
        expect(rollValues.text_at).toContain('Test Manoever: +10');
    });

    it('should handle ATTACK type with SUBTRACT operator', () => {
        const modification = { type: 'ATTACK', operator: 'SUBTRACT', value: 3 };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_at).toBe(-3);
        expect(rollValues.text_at).toContain('Test Manoever: -3');
    });

    it('should handle DAMAGE type with ADD operator', () => {
        const modification = { type: 'DAMAGE', operator: 'ADD', value: 4 };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_dm).toBe(8);
        expect(rollValues.text_dm).toContain('Test Manoever: +8');
    });

    it('should handle DAMAGE type with SUBTRACT operator', () => {
        const modification = { type: 'DAMAGE', operator: 'SUBTRACT', value: 2 };
        processModification(modification, 3, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_dm).toBe(-6);
        expect(rollValues.text_dm).toContain('Test Manoever: -6');
    });

    it('should handle DEFENCE type with ADD operator', () => {
        const modification = { type: 'DEFENCE', operator: 'ADD', value: 7 };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_vt).toBe(7);
        expect(rollValues.text_vt).toContain('Test Manoever: +7');
    });

    it('should handle DEFENCE type with SUBTRACT operator', () => {
        const modification = { type: 'DEFENCE', operator: 'SUBTRACT', value: 5 };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_vt).toBe(-10);
        expect(rollValues.text_vt).toContain('Test Manoever: -10');
    });

    it('should handle WEAPON_DAMAGE type with ADD operator', () => {
        const modification = { type: 'WEAPON_DAMAGE', operator: 'ADD', value: 3 };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.schaden).toContain('+3');
        expect(rollValues.text_dm).toContain('Test Manoever: +3');
    });

    it('should handle WEAPON_DAMAGE type with SUBTRACT operator', () => {
        const modification = { type: 'WEAPON_DAMAGE', operator: 'SUBTRACT', value: 2 };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.schaden).toContain('-4');
        expect(rollValues.text_dm).toContain('Test Manoever: -4');
    });

    it('should handle WEAPON_DAMAGE type with multiplication', () => {
        const modification = { type: 'WEAPON_DAMAGE', operator: 'MULTIPLY', value: 2 };
        processModification(modification, 3, 'Test Manoever', 1, rollValues, mockConfig);

        expect(rollValues.schaden).toContain('*6');
        expect(rollValues.text_dm).toContain('Test Manoever (Head): 6 * Waffenschaden');
    });

    it('should handle modifications with a target property', () => {
        rollValues.context = { someNestedValue: 5 };
        const modification = { type: 'ATTACK', operator: 'ADD', value: 2, target: 'someNestedValue' };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_at).toBe(14); // (2 * 2) + 5 = 14
        expect(rollValues.text_at).toContain('Test Manoever: +14');
    });
});