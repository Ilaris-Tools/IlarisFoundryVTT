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
            schadenstypen: {
                FEUER: 'Feuer',
                EIS: 'Eis',
                PROFAN: 'Profan'
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
            nodmg: {name: '', value: false},
        };
        global.signed = mockSigned;
        global.CONFIG = mockConfig;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle ATTACK type with ADD operator', () => {
        const modification = { type: 'ATTACK', operator: 'ADD', value: 5, affectedByInput: true };
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
        const modification = { type: 'DAMAGE', operator: 'ADD', value: 4, affectedByInput: true };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_dm).toBe(8);
        expect(rollValues.text_dm).toContain('Test Manoever: +8');
    });

    it('should handle DAMAGE type with SUBTRACT operator', () => {
        const modification = { type: 'DAMAGE', operator: 'SUBTRACT', value: 2, affectedByInput: true };
        processModification(modification, 3, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_dm).toBe(-6);
        expect(rollValues.text_dm).toContain('Test Manoever: -6');
    });

    it('should handle DEFENCE type with ADD operator', () => {
        const modification = { type: 'DEFENCE', operator: 'ADD', value: 7, affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_vt).toBe(7);
        expect(rollValues.text_vt).toContain('Test Manoever: +7');
    });

    it('should handle DEFENCE type with SUBTRACT operator', () => {
        const modification = { type: 'DEFENCE', operator: 'SUBTRACT', value: 5, affectedByInput: true };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_vt).toBe(-10);
        expect(rollValues.text_vt).toContain('Test Manoever: -10');
    });

    it('should handle WEAPON_DAMAGE type with ADD operator', () => {
        const modification = { type: 'WEAPON_DAMAGE', operator: 'ADD', value: 3, affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.schaden).toContain('+3');
        expect(rollValues.text_dm).toContain('Test Manoever: +3');
    });

    it('should handle WEAPON_DAMAGE type with SUBTRACT operator', () => {
        const modification = { type: 'WEAPON_DAMAGE', operator: 'SUBTRACT', value: 2, affectedByInput: true };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.schaden).toContain('-4');
        expect(rollValues.text_dm).toContain('Test Manoever: -4');
    });

    it('should handle WEAPON_DAMAGE type with multiplication', () => {
        const modification = { type: 'WEAPON_DAMAGE', operator: 'MULTIPLY', value: 2, affectedByInput: true };
        processModification(modification, 3, 'Test Manoever', 1, rollValues, mockConfig);

        expect(rollValues.schaden).toContain('*6');
        expect(rollValues.text_dm).toContain('Test Manoever (Head): 6 * Waffenschaden');
    });

    it('should handle ZERO_DAMAGE type', () => {
        // First add some damage value
        rollValues.mod_dm = 5;
        rollValues.schaden = '+3';
        
        const modification = { type: 'ZERO_DAMAGE', operator: 'ADD', value: 0, affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.schaden).toBe('0');
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.text_dm).toContain('Test Manoever: Kein Schaden');
    });

    it('should handle modifications with a target property', () => {
        rollValues.context = { someNestedValue: 5 };
        const modification = { type: 'ATTACK', operator: 'ADD', value: 2, target: 'someNestedValue', affectedByInput: true };
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.mod_at).toBe(14); // (2 * 2) + 5 = 14
        expect(rollValues.text_at).toContain('Test Manoever: +14');
    });

    it('should handle CHANGE_DAMAGE_TYPE type', () => {
        const modification = { type: 'CHANGE_DAMAGE_TYPE', value: 'FEUER' };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.text_dm).toContain('Test Manoever: Schadenstyp zu Feuer');
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.schaden).toBe('');
    });

    it('should handle CHANGE_DAMAGE_TYPE type with trefferzone', () => {
        const modification = { type: 'CHANGE_DAMAGE_TYPE', value: 'EIS', affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', 1, rollValues, mockConfig);

        expect(rollValues.text_dm).toContain('Test Manoever (Head): Schadenstyp zu Eis');
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.schaden).toBe('');
    });

    it('should handle ARMOR_BREAKING type', () => {
        const modification = { type: 'ARMOR_BREAKING', affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.text_dm).toContain('Test Manoever: Ignoriert Rüstung');
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.schaden).toBe('');
    });

    it('should handle ARMOR_BREAKING type with trefferzone', () => {
        const modification = { type: 'ARMOR_BREAKING', affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', 2, rollValues, mockConfig);

        expect(rollValues.text_dm).toContain('Test Manoever (Torso): Ignoriert Rüstung');
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.schaden).toBe('');
    });

    it('should handle SPECIAL_TEXT type', () => {
        const modification = { type: 'SPECIAL_TEXT', value: 'Gegner wird zu Boden geworfen', affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig);

        expect(rollValues.text_dm).toContain('Test Manoever: Gegner wird zu Boden geworfen');
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.schaden).toBe('');
    });

    it('should handle SPECIAL_TEXT type with trefferzone', () => {
        const modification = { type: 'SPECIAL_TEXT', value: 'Schild wird zerstört', affectedByInput: true };
        processModification(modification, 1, 'Test Manoever', 2, rollValues, mockConfig);

        expect(rollValues.text_dm).toContain('Test Manoever (Torso): Schild wird zerstört');
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0);
        expect(rollValues.schaden).toBe('');
    });
});

describe('handleModifications', () => {
    let rollValues;
    
    beforeEach(() => {
        rollValues = {
            mod_at: 0,
            mod_vt: 0,
            mod_dm: 0,
            text_at: '',
            text_vt: '',
            text_dm: '',
            schaden: '1W6',
            trefferzone: null,
            nodmg: {name: '', value: false},
            context: {}
        };
        global.CONFIG = {
            ILARIS: {
                trefferzonen: {
                    1: 'Head',
                    2: 'Torso',
                    3: 'Arm',
                    4: 'Leg',
                },
            },
        };
        global.signed = value => (value >= 0 ? `+${value}` : `${value}`);
    });
    
    it('should handle multiple modifications in correct order (ADD/SUBTRACT before MULTIPLY)', () => {
        const allModifications = [
            {
                modification: { type: 'WEAPON_DAMAGE', operator: 'MULTIPLY', value: 2 },
                manoever: { name: 'Test Multiply' },
                number: 1,
                check: true
            },
            {
                modification: { type: 'WEAPON_DAMAGE', operator: 'ADD', value: 3 },
                manoever: { name: 'Test Add' },
                number: 1,
                check: true
            }
        ];
        
        const result = handleModifications(allModifications, rollValues);
        
        expect(result[7]).toBe('(1W6+3)*2'); // schaden should show ADD before MULTIPLY
    });

    it('should handle ZERO_DAMAGE type overriding other modifications', () => {
        const allModifications = [
            {
                modification: { type: 'WEAPON_DAMAGE', operator: 'ADD', value: 3 },
                manoever: { name: 'Test Add' },
                number: 1,
                check: true
            },
            {
                modification: { type: 'ZERO_DAMAGE', operator: 'ADD', value: 0 },
                manoever: { name: 'Zero Damage' },
                number: 1,
                check: true
            }
        ];
        
        const result = handleModifications(allModifications, rollValues);
        
        expect(result[7]).toBe('0'); // schaden
        expect(result[2]).toBe(0); // mod_dm
        expect(result[8].value).toBe(true); // nodmg.value
        expect(result[8].name).toBe('Zero Damage'); // nodmg.name
    });

    it('should handle modifications with number input', () => {
        const allModifications = [
            {
                modification: { type: 'ATTACK', operator: 'ADD', value: 2, affectedByInput: true },
                manoever: { name: 'Test Number' },
                number: 3,
                check: false
            }
        ];
        
        const result = handleModifications(allModifications, rollValues);
        
        expect(result[0]).toBe(6); // mod_at should be 2 * 3
    });

    it('should handle modifications with checkbox input', () => {
        const allModifications = [
            {
                modification: { type: 'DEFENCE', operator: 'ADD', value: 2, affectedByInput: false },
                manoever: { name: 'Test Checkbox' },
                number: undefined,
                check: true
            }
        ];
        
        const result = handleModifications(allModifications, rollValues);
        
        expect(result[1]).toBe(2); // mod_vt
    });

    it('should handle modifications with trefferzone input', () => {
        const allModifications = [
            {
                modification: { type: 'DAMAGE', operator: 'ADD', value: 2 },
                manoever: { name: 'Test Zone' },
                number: undefined,
                check: undefined,
                trefferZoneInput: 1
            }
        ];
        
        const result = handleModifications(allModifications, rollValues);
        
        expect(result[6]).toBe(1); // trefferzone
        expect(result[5]).toContain('Head'); // text_dm should include zone name
    });

    it('should preserve modification order within same operator type', () => {
        const allModifications = [
            {
                modification: { type: 'ATTACK', operator: 'ADD', value: 2 },
                manoever: { name: 'First Add' },
                number: 1,
                check: true
            },
            {
                modification: { type: 'ATTACK', operator: 'ADD', value: 3 },
                manoever: { name: 'Second Add' },
                number: 1,
                check: true
            }
        ];
        
        const result = handleModifications(allModifications, rollValues);
        
        expect(result[3]).toMatch(/First Add.*Second Add/s); // text_at should preserve order
    });
});