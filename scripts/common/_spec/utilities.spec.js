import { sanitizeEnergyCost, isNumericCost, formatDiceFormula } from '../utilities.js'

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

describe('formatDiceFormula', () => {
    describe('standard dice formulas', () => {
        it('should format 3d20dl1dh1 as 3W20 (Median)', () => {
            expect(formatDiceFormula('3d20dl1dh1')).toBe('3W20 (Median)')
        })

        it('should format 2d20dl1 as 2W20 (Schip)', () => {
            expect(formatDiceFormula('2d20dl1')).toBe('2W20 (Schip)')
        })

        it('should format 3d20dl2 as 3W20 (Schip)', () => {
            expect(formatDiceFormula('3d20dl2')).toBe('3W20 (Schip)')
        })

        it('should format 4d20dl2dh1 as 4W20 (Median, Schip)', () => {
            expect(formatDiceFormula('4d20dl2dh1')).toBe('4W20 (Median, Schip)')
        })

        it('should format 1d20 as 1W20', () => {
            expect(formatDiceFormula('1d20')).toBe('1W20')
        })

        it('should format 5d20dl3dh1 as 5W20 (Median, Schip)', () => {
            expect(formatDiceFormula('5d20dl3dh1')).toBe('5W20 (Median, Schip)')
        })

        it('should format 2d6 as 2W6', () => {
            expect(formatDiceFormula('2d6')).toBe('2W6')
        })

        it('should format 1d6 as 1W6', () => {
            expect(formatDiceFormula('1d6')).toBe('1W6')
        })
    })

    describe('edge cases', () => {
        it('should return null for null input', () => {
            expect(formatDiceFormula(null)).toBe(null)
        })

        it('should return undefined for undefined input', () => {
            expect(formatDiceFormula(undefined)).toBe(undefined)
        })

        it('should return empty string for empty string', () => {
            expect(formatDiceFormula('')).toBe('')
        })

        it('should return original string for invalid format', () => {
            expect(formatDiceFormula('invalid')).toBe('invalid')
            expect(formatDiceFormula('abc123')).toBe('abc123')
        })
    })
})
