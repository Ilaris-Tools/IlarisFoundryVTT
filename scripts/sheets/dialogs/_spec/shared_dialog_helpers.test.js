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
        mockConfig.ILARIS.schadenstypen = {
            FEUER: 'Feuer',
            EIS: 'Eis',
            PROFAN: 'Profan'
        };
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
            schaden: '1W6',
            trefferzone: null,
            nodmg: {name: '', value: false},
            context: {}
        };
        global.signed = value => (value >= 0 ? `+${value}` : `${value}`);
    });
    
    it('should handle multiple modifications correctly', () => {
        const manoever = {
            name: 'Test Manoever',
            system: {
                modifications: [
                    { type: 'ATTACK', operator: 'ADD', value: 2, affectedByInput: true },
                    { type: 'DAMAGE', operator: 'ADD', value: 3, affectedByInput: false }
                ]
            }
        };
        
        const result = handleModifications(manoever, 2, true, null, rollValues, mockConfig);
        
        expect(result[0]).toBe(4); // mod_at
        expect(result[2]).toBe(3); // mod_dm
    });

    it('should handle multiple modifications correctly', () => {
        const manoever = {
            name: 'Test Manoever',
            system: {
                modifications: [
                    { type: 'WEAPON_DAMAGE', operator: 'ADD', value: 2 },
                    { type: 'WEAPON_DAMAGE', operator: 'MULTIPLY', value: 3 }
                ]
            }
        };
        
        const result = handleModifications(manoever, 1, true, null, rollValues, mockConfig);
        
        expect(result[7]).toBe('(1W6+2)*3'); // mod_dm
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