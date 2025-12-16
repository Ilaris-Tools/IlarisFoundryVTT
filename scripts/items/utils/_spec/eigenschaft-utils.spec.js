// Mock global dependencies
global.foundry = {
    utils: {
        getProperty: (obj, path) => {
            return path.split('.').reduce((acc, part) => acc?.[part], obj)
        },
    },
}

const {
    checkCondition,
    compareValues,
    evaluateFormula,
    executeCustomScript,
} = require('../eigenschaft-utils.js')

describe('eigenschaft-utils', () => {
    let mockActor

    beforeEach(() => {
        // Create mock actor
        mockActor = {
            system: {
                attribute: {
                    KK: { wert: 8 },
                    KO: { wert: 6 },
                    GE: { wert: 5 },
                },
            },
        }
    })

    describe('compareValues', () => {
        it('should compare with < operator', () => {
            expect(compareValues(5, '<', 10)).toBe(true)
            expect(compareValues(10, '<', 5)).toBe(false)
        })

        it('should compare with <= operator', () => {
            expect(compareValues(5, '<=', 5)).toBe(true)
            expect(compareValues(10, '<=', 5)).toBe(false)
        })

        it('should compare with > operator', () => {
            expect(compareValues(10, '>', 5)).toBe(true)
            expect(compareValues(5, '>', 10)).toBe(false)
        })

        it('should compare with >= operator', () => {
            expect(compareValues(5, '>=', 5)).toBe(true)
            expect(compareValues(4, '>=', 5)).toBe(false)
        })

        it('should compare with == operator', () => {
            expect(compareValues(5, '==', 5)).toBe(true)
            expect(compareValues(5, '==', 6)).toBe(false)
        })

        it('should compare with != operator', () => {
            expect(compareValues(5, '!=', 6)).toBe(true)
            expect(compareValues(5, '!=', 5)).toBe(false)
        })

        it('should return true for unknown operator', () => {
            expect(compareValues(5, 'unknown', 10)).toBe(true)
        })
    })

    describe('evaluateFormula', () => {
        it('should evaluate simple actor property reference', () => {
            const result = evaluateFormula('@actor.system.attribute.KK.wert', mockActor)
            expect(result).toBe(8)
        })

        it('should evaluate formula with multiple references', () => {
            const result = evaluateFormula(
                '@actor.system.attribute.KK.wert + @actor.system.attribute.KO.wert',
                mockActor,
            )
            expect(result).toBe(14) // 8 + 6
        })

        it('should evaluate formula with arithmetic', () => {
            const result = evaluateFormula('@actor.system.attribute.KK.wert * 2', mockActor)
            expect(result).toBe(16) // 8 * 2
        })

        it('should handle missing properties as 0', () => {
            const result = evaluateFormula('@actor.system.nonexistent.value', mockActor)
            expect(result).toBe(0)
        })

        it('should return 0 on evaluation error', () => {
            const result = evaluateFormula('invalid javascript syntax @@', mockActor)
            expect(result).toBe(0)
        })
    })

    describe('checkCondition', () => {
        it('should check attribute_check with < operator (passing)', () => {
            const condition = {
                type: 'attribute_check',
                attribute: 'KK',
                operator: '<',
                value: 10,
            }

            expect(checkCondition(condition, mockActor)).toBe(true) // 8 < 10
        })

        it('should check attribute_check with < operator (failing)', () => {
            const condition = {
                type: 'attribute_check',
                attribute: 'KK',
                operator: '<',
                value: 5,
            }

            expect(checkCondition(condition, mockActor)).toBe(false) // 8 < 5
        })

        it('should check attribute_check with > operator', () => {
            const condition = {
                type: 'attribute_check',
                attribute: 'KK',
                operator: '>',
                value: 10,
            }

            expect(checkCondition(condition, mockActor)).toBe(false) // 8 > 10
        })

        it('should check attribute_check with >= operator', () => {
            const condition = {
                type: 'attribute_check',
                attribute: 'KK',
                operator: '>=',
                value: 8,
            }

            expect(checkCondition(condition, mockActor)).toBe(true) // 8 >= 8
        })

        it('should return true for unknown condition type', () => {
            const condition = {
                type: 'unknown',
            }

            expect(checkCondition(condition, mockActor)).toBe(true)
        })

        it('should execute custom_script conditions', () => {
            const condition = {
                type: 'custom_script',
                script: 'return actor.system.attribute.KK.wert > 5',
            }

            expect(checkCondition(condition, mockActor)).toBe(true)
        })
    })

    describe('executeCustomScript', () => {
        it('should execute script with weapon, computed, and actor context', () => {
            const script = 'return actor.system.attribute.KK.wert + 10'
            const result = executeCustomScript(script, {}, mockActor)
            expect(result).toBe(18) // 8 + 10
        })

        it('should modify computed object', () => {
            const computed = { at: 0 }
            const script = 'computed.at += 5; return true'
            executeCustomScript(script, computed, mockActor)
            expect(computed.at).toBe(5)
        })

        it('should have access to weapon parameter', () => {
            const weapon = { name: 'Test Sword' }
            const script = 'return weapon.name'
            const result = executeCustomScript(script, {}, mockActor, weapon)
            expect(result).toBe('Test Sword')
        })

        it('should return false on script error', () => {
            const script = 'invalid javascript @@'
            const result = executeCustomScript(script, {}, mockActor)
            expect(result).toBe(false)
        })

        it('should handle null weapon parameter', () => {
            const script = 'return weapon === null'
            const result = executeCustomScript(script, {}, mockActor, null)
            expect(result).toBe(true)
        })
    })
})
