import { processModification, handleModifications } from '../shared_dialog_helpers.js';

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

    it('should handle ZERO_DAMAGE type', () => {
        // First add some damage value
        rollValues.mod_dm = 5;
        rollValues.schaden = '+3';
        
        const modification = { type: 'ZERO_DAMAGE', operator: 'ADD', value: 0 };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.schaden).toBe('0');
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.text_dm).toContain('Test Manoever: Kein Schaden');
    });

    it('should handle modifications with a target property', () => {
        rollValues.context = { someNestedValue: 5 };
        const modification = { type: 'ATTACK', operator: 'ADD', value: 2, target: 'someNestedValue' };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_at).toBe(14); // (2 * 2) + 5 = 14
        expect(rollValues.text_at).toContain('Test Manoever: +14');
    });
});

describe('handleModifications', () => {
    let rollValues;
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
            trefferzone: null,
            context: {}
        };
        global.signed = value => (value >= 0 ? `+${value}` : `${value}`);
    });
    
    it('should handle multiple modifications correctly', () => {
        const manoever = {
            name: 'Test Manoever',
            system: {
                modifications: [
                    { type: 'ATTACK', operator: 'ADD', value: 2 },
                    { type: 'DAMAGE', operator: 'ADD', value: 3 }
                ]
            }
        };
        
        const result = handleModifications(manoever, 2, true, null, rollValues, mockConfig);
        
        expect(result[0]).toBe(4); // mod_at
        expect(result[2]).toBe(6); // mod_dm
    });
    
    it('should override damage values when ZERO_DAMAGE is present', () => {
        const manoever = {
            name: 'Zero Damage Manoever',
            system: {
                modifications: [
                    { type: 'ATTACK', operator: 'ADD', value: 2 },
                    { type: 'DAMAGE', operator: 'ADD', value: 3 },
                    { type: 'ZERO_DAMAGE', operator: 'ADD', value: 0 }
                ]
            }
        };
        
        const result = handleModifications(manoever, 1, true, null, rollValues, mockConfig);
        
        expect(result[0]).toBe(2); // mod_at (still applied)
        expect(result[2]).toBe(0); // mod_dm (reset to 0)
        expect(result[7]).toBe('0'); // schaden (set to 0)
        expect(result[5]).toContain('Kein Schaden'); // text_dm
    });
});