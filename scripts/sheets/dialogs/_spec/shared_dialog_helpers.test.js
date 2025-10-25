import {
    processModification,
    handleModifications,
    applyOperator,
} from '../shared_dialog_helpers.js'

describe('processModification', () => {
    let rollValues
    const mockSigned = jest.fn((value) => (value >= 0 ? `+${value}` : `${value}`))
    const mockConfig = {
        ILARIS: {
            trefferzonen: {
                1: 'Beine',
                2: 'Schildarm',
                3: 'Schwertarm',
                4: 'Bauch',
                5: 'Brust',
                6: 'Kopf',
            },
            schadenstypen: {
                FEUER: 'Feuer',
                EIS: 'Eis',
                PROFAN: 'Profan',
            },
        },
    }

    beforeEach(() => {
        rollValues = {
            mod_at: 0,
            mod_vt: 0,
            mod_dm: 0,
            mod_energy: 0,
            text_at: '',
            text_vt: '',
            text_dm: '',
            text_energy: '',
            schaden: '',
            nodmg: { name: '', value: false },
        }
        global.signed = mockSigned
        global.CONFIG = mockConfig
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should handle ATTACK type with ADD operator', () => {
        const modification = { type: 'ATTACK', operator: 'ADD', value: 5, affectedByInput: true }
        processModification(modification, 2, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_at).toBe(10)
        expect(rollValues.text_at).toContain('Test Manoever: +10')
    })

    it('should handle ATTACK type with DIVIDE operator', () => {
        rollValues.mod_at = 20
        const modification = { type: 'ATTACK', operator: 'DIVIDE', value: 2, affectedByInput: true }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_at).toBe(10)
        expect(rollValues.text_at).toContain('Test Manoever: +2 /')
    })

    it('should handle ATTACK type with MULTIPLY operator', () => {
        rollValues.mod_at = 5
        const modification = {
            type: 'ATTACK',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_at).toBe(10)
        expect(rollValues.text_at).toContain('Test Manoever: +2 *')
    })

    it('should handle ATTACK type with SUBTRACT operator', () => {
        const modification = { type: 'ATTACK', operator: 'SUBTRACT', value: 3 }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.mod_at).toBe(-3)
        expect(rollValues.text_at).toContain('Test Manoever: -3')
    })

    it('should handle DAMAGE type with ADD operator', () => {
        const modification = { type: 'DAMAGE', operator: 'ADD', value: 4, affectedByInput: true }
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.mod_dm).toBe(8)
        expect(rollValues.text_dm).toContain('Test Manoever: +8')
    })

    it('should handle DAMAGE type with DIVIDE operator', () => {
        rollValues.mod_dm = 20
        const modification = { type: 'DAMAGE', operator: 'DIVIDE', value: 2, affectedByInput: true }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_dm).toBe(10)
        expect(rollValues.text_dm).toContain('Test Manoever: +2 /')
    })

    it('should handle DAMAGE type with MULTIPLY operator', () => {
        rollValues.mod_dm = 5
        const modification = {
            type: 'DAMAGE',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_dm).toBe(10)
        expect(rollValues.text_dm).toContain('Test Manoever: +2 *')
    })

    it('should handle DAMAGE type with SUBTRACT operator', () => {
        const modification = {
            type: 'DAMAGE',
            operator: 'SUBTRACT',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 3, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.mod_dm).toBe(-6)
        expect(rollValues.text_dm).toContain('Test Manoever: -6')
    })

    it('should handle DEFENCE type with ADD operator', () => {
        const modification = { type: 'DEFENCE', operator: 'ADD', value: 7, affectedByInput: true }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.mod_vt).toBe(7)
        expect(rollValues.text_vt).toContain('Test Manoever: +7')
    })

    it('should handle DEFENCE type with DIVIDE operator', () => {
        rollValues.mod_vt = 20
        const modification = {
            type: 'DEFENCE',
            operator: 'DIVIDE',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_vt).toBe(10)
        expect(rollValues.text_vt).toContain('Test Manoever: +2 /')
    })

    it('should handle DEFENCE type with MULTIPLY operator', () => {
        rollValues.mod_vt = 5
        const modification = {
            type: 'DEFENCE',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.mod_vt).toBe(10)
        expect(rollValues.text_vt).toContain('Test Manoever: +2 *')
    })

    it('should handle WEAPON_DAMAGE type with ADD operator', () => {
        const modification = {
            type: 'WEAPON_DAMAGE',
            operator: 'ADD',
            value: 3,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.schaden).toContain('+3')
        expect(rollValues.text_dm).toContain('Test Manoever: +3')
    })

    it('should handle WEAPON_DAMAGE type with DIVIDE operator', () => {
        rollValues.schaden = '1W6+3'
        const modification = {
            type: 'WEAPON_DAMAGE',
            operator: 'DIVIDE',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.schaden).toBe('(1W6+3)/2')
        expect(rollValues.text_dm).toContain('Test Manoever: 2 / Waffenschaden')
    })

    it('should handle WEAPON_DAMAGE type with MULTIPLY operator', () => {
        rollValues.schaden = '1W6+3'
        const modification = {
            type: 'WEAPON_DAMAGE',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues)

        expect(rollValues.schaden).toBe('(1W6+3)*2')
        expect(rollValues.text_dm).toContain('Test Manoever: 2 * Waffenschaden')
    })

    it('should handle WEAPON_DAMAGE type with SUBTRACT operator', () => {
        const modification = {
            type: 'WEAPON_DAMAGE',
            operator: 'SUBTRACT',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.schaden).toContain('-4')
        expect(rollValues.text_dm).toContain('Test Manoever: -4')
    })

    it('should handle ZERO_DAMAGE type', () => {
        // First add some damage value
        rollValues.mod_dm = 5
        rollValues.schaden = '+3'

        const modification = {
            type: 'ZERO_DAMAGE',
            operator: 'ADD',
            value: 0,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.schaden).toBe('0')
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.text_dm).toContain('Test Manoever: Kein Schaden')
    })

    it('should handle modifications with a target property', () => {
        rollValues.context = { someNestedValue: 5 }
        const modification = {
            type: 'ATTACK',
            operator: 'ADD',
            value: 2,
            target: 'someNestedValue',
            affectedByInput: true,
        }
        processModification(modification, 2, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.mod_at).toBe(14) // (2 * 2) + 5 = 14
        expect(rollValues.text_at).toContain('Test Manoever: +14')
    })

    it('should handle CHANGE_DAMAGE_TYPE type', () => {
        const modification = { type: 'CHANGE_DAMAGE_TYPE', value: 'FEUER' }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.text_dm).toContain('Test Manoever: Schadenstyp zu Feuer')
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.schaden).toBe('')
    })

    it('should handle CHANGE_DAMAGE_TYPE type with trefferzone', () => {
        const modification = { type: 'CHANGE_DAMAGE_TYPE', value: 'EIS', affectedByInput: true }
        processModification(modification, 1, 'Test Manoever', 1, rollValues, mockConfig)

        expect(rollValues.text_dm).toContain('Test Manoever (Beine): Schadenstyp zu Eis')
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.schaden).toBe('')
    })

    it('should handle ARMOR_BREAKING type', () => {
        const modification = { type: 'ARMOR_BREAKING', affectedByInput: true }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.text_dm).toContain('Test Manoever: Ignoriert Rüstung')
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.schaden).toBe('')
    })

    it('should handle ARMOR_BREAKING type with trefferzone', () => {
        const modification = { type: 'ARMOR_BREAKING', affectedByInput: true }
        processModification(modification, 1, 'Test Manoever', 2, rollValues, mockConfig)

        expect(rollValues.text_dm).toContain('Test Manoever (Schildarm): Ignoriert Rüstung')
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.schaden).toBe('')
    })

    it('should handle SPECIAL_TEXT type', () => {
        const modification = {
            type: 'SPECIAL_TEXT',
            value: 'Gegner wird zu Boden geworfen',
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, mockConfig)

        expect(rollValues.text_dm).toContain('Test Manoever: Gegner wird zu Boden geworfen')
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.schaden).toBe('')
    })

    it('should handle SPECIAL_TEXT type with trefferzone', () => {
        const modification = {
            type: 'SPECIAL_TEXT',
            value: 'Schild wird zerstört',
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', 2, rollValues, mockConfig)

        expect(rollValues.text_dm).toContain('Test Manoever (Schildarm): Schild wird zerstört')
        // Should not modify any other values
        expect(rollValues.mod_dm).toBe(0)
        expect(rollValues.schaden).toBe('')
    })

    it('should handle SPECIAL_RESOURCE type with DIVIDE operator', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'DIVIDE',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, 20)

        expect(rollValues.mod_energy).toBe(-10) // (20/2) * -1 = -10
        expect(rollValues.text_energy).toContain('Test Manoever: -10 Energiekosten')
    })

    it('should handle SPECIAL_RESOURCE type with DIVIDE operator (value < 1)', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'DIVIDE',
            value: 0.5,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, 20)

        expect(rollValues.mod_energy).toBe(20) // (20/0.5) - 20 = 20
        expect(rollValues.text_energy).toContain('Test Manoever: +20 Energiekosten')
    })

    it('should handle SPECIAL_RESOURCE type with MULTIPLY operator', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, 10)

        expect(rollValues.mod_energy).toBe(10) // (10*2) - 10 = 10
        expect(rollValues.text_energy).toContain('Test Manoever: +10 Energiekosten')
    })

    it('should handle SPECIAL_RESOURCE type with MULTIPLY operator (value < 1)', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'MULTIPLY',
            value: 0.5,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, 10)

        expect(rollValues.mod_energy).toBe(-5) // (10*0.5) * -1 = -5
        expect(rollValues.text_energy).toContain('Test Manoever: -5 Energiekosten')
    })

    it('should handle SPECIAL_RESOURCE type with ADD operator', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'ADD',
            value: 3,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, 5)

        expect(rollValues.mod_energy).toBe(3)
        expect(rollValues.text_energy).toContain('Test Manoever: +3 Energiekosten')
    })

    it('should handle SPECIAL_RESOURCE type with SUBTRACT operator', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'SUBTRACT',
            value: 3,
            affectedByInput: true,
        }
        processModification(modification, 1, 'Test Manoever', null, rollValues, 10)

        expect(rollValues.mod_energy).toBe(-3)
        expect(rollValues.text_energy).toContain('Test Manoever: -3 Energiekosten')
    })

    it('should accumulate SPECIAL_RESOURCE modifications', () => {
        rollValues.mod_energy = 5
        const modification1 = {
            type: 'SPECIAL_RESOURCE',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }
        const modification2 = {
            type: 'SPECIAL_RESOURCE',
            operator: 'ADD',
            value: 3,
            affectedByInput: true,
        }

        let result1 = processModification(modification1, 1, 'Test Manoever 1', null, rollValues, 10)
        rollValues = result1.rollValues
        let result2 = processModification(
            modification2,
            1,
            'Test Manoever 2',
            null,
            rollValues,
            result1.originalRessourceCost,
        )

        expect(result2.rollValues.mod_energy).toBe(18) // First: 5 + ((10*2) - 10) = 15, Then: 15 + 3 = 18
        expect(result2.rollValues.text_energy).toContain('Test Manoever 1: +10 Energiekosten')
        expect(result2.rollValues.text_energy).toContain('Test Manoever 2: +3 Energiekosten')
    })

    it('should handle SPECIAL_RESOURCE type with SET operator and modify originalRessourceCost', () => {
        rollValues.mod_energy = 0
        const modification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'SET',
            value: 15,
            affectedByInput: true,
        }
        const result = processModification(modification, 1, 'Test Manoever', null, rollValues, 10)

        expect(result.rollValues.mod_energy).toBe(15)
        expect(result.originalRessourceCost).toBe(15) // Should be updated to the SET value
        expect(result.rollValues.text_energy).toContain(
            'Test Manoever: Setzt Energiekosten auf 15 als Basiswert',
        )
    })

    it('should use updated originalRessourceCost after SET operation for subsequent modifications', () => {
        rollValues.mod_energy = 0

        // First modification: SET operation that changes originalRessourceCost
        const setModification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'SET',
            value: 20,
            affectedByInput: true,
        }

        // Second modification: MULTIPLY operation that should use the new originalRessourceCost
        const multiplyModification = {
            type: 'SPECIAL_RESOURCE',
            operator: 'MULTIPLY',
            value: 2,
            affectedByInput: true,
        }

        // Process SET modification
        let result1 = processModification(setModification, 1, 'Set Base Cost', null, rollValues, 10)
        rollValues = result1.rollValues

        // Process MULTIPLY modification using updated originalRessourceCost
        let result2 = processModification(
            multiplyModification,
            1,
            'Multiply Cost',
            null,
            rollValues,
            result1.originalRessourceCost,
        )

        // After SET: mod_energy = 20, originalRessourceCost = 20
        // After MULTIPLY: mod_energy = 20 + ((20*2) - 20) = 20 + 20 = 40
        expect(result2.rollValues.mod_energy).toBe(40)
        expect(result2.originalRessourceCost).toBe(20) // Should remain the SET value
        expect(result2.rollValues.text_energy).toContain(
            'Set Base Cost: Setzt Energiekosten auf 20 als Basiswert',
        )
        expect(result2.rollValues.text_energy).toContain('Multiply Cost: +20 Energiekosten')
    })
})

describe('handleModifications', () => {
    let rollValues

    beforeEach(() => {
        rollValues = {
            mod_at: 0,
            mod_vt: 0,
            mod_dm: 0,
            mod_energy: 0,
            text_at: '',
            text_vt: '',
            text_dm: '',
            text_energy: '',
            schaden: '1W6',
            trefferzone: null,
            nodmg: { name: '', value: false },
            context: {},
        }
        global.CONFIG = {
            ILARIS: {
                trefferzonen: {
                    1: 'Beine',
                    2: 'Schildarm',
                    3: 'Schwertarm',
                    4: 'Bauch',
                    5: 'Brust',
                    6: 'Kopf',
                },
            },
        }
        global.signed = (value) => (value >= 0 ? `+${value}` : `${value}`)
    })

    it('should handle multiple SPECIAL_RESOURCE modifications in correct order', () => {
        rollValues.mod_energy = 10
        const allModifications = [
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'MULTIPLY',
                    value: 2,
                    affectedByInput: true,
                },
                manoever: { name: 'Test Multiply' },
                number: 1,
                check: true,
            },
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'ADD',
                    value: 3,
                    affectedByInput: true,
                },
                manoever: { name: 'Test Add' },
                number: 1,
                check: true,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        expect(result[3]).toBe(23) // First: ((10*2) - 10) = 10, Then: 10 + 3 = 13
        expect(result[7]).toContain('Test Multiply: +10 Energiekosten')
        expect(result[7]).toContain('Test Add: +3 Energiekosten')
    })

    it('should handle multiple SPECIAL_RESOURCE modifications with values < 1', () => {
        rollValues.mod_energy = 10
        const allModifications = [
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'MULTIPLY',
                    value: 0.5,
                    affectedByInput: true,
                },
                manoever: { name: 'Test Multiply' },
                number: 1,
                check: true,
            },
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'DIVIDE',
                    value: 0.5,
                    affectedByInput: true,
                },
                manoever: { name: 'Test Divide' },
                number: 1,
                check: true,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        expect(result[3]).toBe(15) // First: (10*0.5)*-1 = -5, Then: ((10/0.5) - 10) = 10, Total: -5 + 20 = 15
        expect(result[7]).toContain('Test Multiply: -5 Energiekosten')
        expect(result[7]).toContain('Test Divide: +10 Energiekosten')
    })

    it('should handle ZERO_DAMAGE type overriding other modifications', () => {
        const allModifications = [
            {
                modification: { type: 'WEAPON_DAMAGE', operator: 'ADD', value: 3 },
                manoever: { name: 'Test Add' },
                number: 1,
                check: true,
            },
            {
                modification: { type: 'ZERO_DAMAGE', operator: 'ADD', value: 0 },
                manoever: { name: 'Zero Damage' },
                number: 1,
                check: true,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        expect(result[9]).toBe('0') // schaden
        expect(result[2]).toBe(0) // mod_dm
        expect(result[10].value).toBe(true) // nodmg.value
        expect(result[10].name).toBe('Zero Damage') // nodmg.name
    })

    it('should handle modifications with number input', () => {
        const allModifications = [
            {
                modification: { type: 'ATTACK', operator: 'ADD', value: 2, affectedByInput: true },
                manoever: { name: 'Test Number' },
                number: 3,
                check: false,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        expect(result[0]).toBe(6) // mod_at should be 2 * 3
    })

    it('should handle modifications with checkbox input', () => {
        const allModifications = [
            {
                modification: {
                    type: 'DEFENCE',
                    operator: 'ADD',
                    value: 2,
                    affectedByInput: false,
                },
                manoever: { name: 'Test Checkbox' },
                number: undefined,
                check: true,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        expect(result[1]).toBe(2) // mod_vt
    })

    it('should handle modifications with trefferzone input', () => {
        const allModifications = [
            {
                modification: { type: 'DAMAGE', operator: 'ADD', value: 2 },
                manoever: { name: 'Test Zone' },
                number: undefined,
                check: undefined,
                trefferZoneInput: 1,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        expect(result[8]).toBe(1) // trefferzone
        expect(result[6]).toContain('Beine') // text_dm should include zone name
    })

    it('should handle SPECIAL_RESOURCE SET operation followed by other operations', () => {
        rollValues.mod_energy = 5 // Starting with some energy cost
        const allModifications = [
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'SET',
                    value: 25,
                    affectedByInput: true,
                },
                manoever: { name: 'Set Base' },
                number: 1,
                check: true,
            },
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'MULTIPLY',
                    value: 2,
                    affectedByInput: true,
                },
                manoever: { name: 'Double Cost' },
                number: 1,
                check: true,
            },
            {
                modification: {
                    type: 'SPECIAL_RESOURCE',
                    operator: 'ADD',
                    value: 5,
                    affectedByInput: true,
                },
                manoever: { name: 'Add Extra' },
                number: 1,
                check: true,
            },
        ]

        const result = handleModifications(allModifications, rollValues)

        // Processing order: SET (sets to 25), ADD (25 + 5 = 30), MULTIPLY (uses originalRessourceCost of 25: (25*2) - 25 = 25, so 30 + 25 = 55)
        expect(result[3]).toBe(55) // mod_energy
        expect(result[7]).toContain('Set Base: Setzt Energiekosten auf 25 als Basiswert')
        expect(result[7]).toContain('Add Extra: +5 Energiekosten')
        expect(result[7]).toContain('Double Cost: +25 Energiekosten')
    })
})

describe('applyOperator', () => {
    describe('DIVIDE operator', () => {
        it('should divide the current value by the given value', () => {
            expect(applyOperator(10, 2, 'DIVIDE')).toBe(5)
            expect(applyOperator(20, 4, 'DIVIDE')).toBe(5)
            expect(applyOperator(100, 10, 'DIVIDE')).toBe(10)
        })

        it('should handle division by 1', () => {
            expect(applyOperator(10, 1, 'DIVIDE')).toBe(10)
        })

        it('should handle division resulting in decimals', () => {
            expect(applyOperator(10, 3, 'DIVIDE')).toBe(4)
        })
    })

    describe('MULTIPLY operator', () => {
        it('should multiply the current value by the given value', () => {
            expect(applyOperator(10, 2, 'MULTIPLY')).toBe(20)
            expect(applyOperator(5, 4, 'MULTIPLY')).toBe(20)
            expect(applyOperator(100, 0.5, 'MULTIPLY')).toBe(50)
        })

        it('should handle multiplication by 1', () => {
            expect(applyOperator(10, 1, 'MULTIPLY')).toBe(10)
        })

        it('should handle multiplication by 0', () => {
            expect(applyOperator(10, 0, 'MULTIPLY')).toBe(0)
        })
    })

    describe('ADD operator', () => {
        it('should add the given value to the current value', () => {
            expect(applyOperator(10, 2, 'ADD')).toBe(12)
            expect(applyOperator(5, 4, 'ADD')).toBe(9)
            expect(applyOperator(100, -20, 'ADD')).toBe(80)
        })

        it('should handle addition of 0', () => {
            expect(applyOperator(10, 0, 'ADD')).toBe(10)
        })
    })

    describe('SUBTRACT operator', () => {
        it('should subtract the given value from the current value', () => {
            expect(applyOperator(10, 2, 'SUBTRACT')).toBe(8)
            expect(applyOperator(5, 4, 'SUBTRACT')).toBe(1)
            expect(applyOperator(100, 20, 'SUBTRACT')).toBe(80)
        })

        it('should handle subtraction of 0', () => {
            expect(applyOperator(10, 0, 'SUBTRACT')).toBe(10)
        })

        it('should handle negative results', () => {
            expect(applyOperator(5, 10, 'SUBTRACT')).toBe(-5)
        })
    })

    describe('Edge cases', () => {
        it('should handle zero as current value', () => {
            expect(applyOperator(0, 5, 'ADD')).toBe(5)
            expect(applyOperator(0, 5, 'SUBTRACT')).toBe(-5)
            expect(applyOperator(0, 5, 'MULTIPLY')).toBe(0)
            expect(applyOperator(0, 5, 'DIVIDE')).toBe(0)
        })

        it('should handle negative values', () => {
            expect(applyOperator(-10, 5, 'ADD')).toBe(-5)
            expect(applyOperator(-10, 5, 'SUBTRACT')).toBe(-15)
            expect(applyOperator(-10, 5, 'MULTIPLY')).toBe(-50)
            expect(applyOperator(-10, 5, 'DIVIDE')).toBe(-2)
        })
    })
})
