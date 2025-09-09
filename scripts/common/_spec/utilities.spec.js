import { sanitizeEnergyCost, isNumericCost } from '../utilities.js'

describe('sanitizeEnergyCost', () => {
    it('should return number input unchanged', () => {
        expect(sanitizeEnergyCost(5)).toBe(5)
        expect(sanitizeEnergyCost(0)).toBe(0)
        expect(sanitizeEnergyCost(-3)).toBe(-3)
    })

    it('should extract numbers from string input', () => {
        expect(sanitizeEnergyCost('5')).toBe(5)
        expect(sanitizeEnergyCost('10')).toBe(10)
        expect(sanitizeEnergyCost('42')).toBe(42)
    })

    it('should extract first number from mixed strings', () => {
        expect(sanitizeEnergyCost('5 AsP')).toBe(5)
        expect(sanitizeEnergyCost('10 pro Stufe')).toBe(10)
        expect(sanitizeEnergyCost('mind. 8')).toBe(8)
    })

    it('should return 0 for non-numeric strings', () => {
        expect(sanitizeEnergyCost('beliebig')).toBe(0)
        expect(sanitizeEnergyCost('nach Dämon')).toBe(0)
        expect(sanitizeEnergyCost('variabel')).toBe(0)
        expect(sanitizeEnergyCost('')).toBe(0)
    })

    it('should handle null and undefined', () => {
        expect(sanitizeEnergyCost(null)).toBe(0)
        expect(sanitizeEnergyCost(undefined)).toBe(0)
    })
})

describe('isNumericCost', () => {
    it('should return true for number input', () => {
        expect(isNumericCost(5)).toBe(true)
        expect(isNumericCost(0)).toBe(true)
        expect(isNumericCost(-3)).toBe(true)
    })

    it('should return true for numeric strings', () => {
        expect(isNumericCost('5')).toBe(true)
        expect(isNumericCost('10')).toBe(true)
        expect(isNumericCost('42')).toBe(true)
    })

    it('should return true for strings containing numbers', () => {
        expect(isNumericCost('5 AsP')).toBe(true)
        expect(isNumericCost('10 pro Stufe')).toBe(true)
        expect(isNumericCost('mind. 8')).toBe(true)
        expect(isNumericCost('2-8')).toBe(true)
    })

    it('should return false for purely non-numeric strings', () => {
        expect(isNumericCost('beliebig')).toBe(false)
        expect(isNumericCost('nach Dämon')).toBe(false)
        expect(isNumericCost('variabel')).toBe(false)
        expect(isNumericCost('')).toBe(false)
    })

    it('should return false for null, undefined, and non-strings', () => {
        expect(isNumericCost(null)).toBe(false)
        expect(isNumericCost(undefined)).toBe(false)
        expect(isNumericCost({})).toBe(false)
        expect(isNumericCost([])).toBe(false)
    })
})
