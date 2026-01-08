/**
 * Tests for eigenschaft-parser.js
 */
import {
    parseEigenschaftString,
    parseEigenschaftenArray,
    formatEigenschaftDisplay,
    isStructuredEigenschaft,
    normalizeEigenschaften,
    extractEigenschaftKey,
} from '../eigenschaft-parser.js'

describe('eigenschaft-parser', () => {
    describe('parseEigenschaftString', () => {
        it('should parse simple eigenschaft without parameters', () => {
            const result = parseEigenschaftString('Zweihändig')
            expect(result).toEqual({ key: 'Zweihändig', parameters: [] })
        })

        it('should parse eigenschaft with single numeric parameter', () => {
            const result = parseEigenschaftString('Schwer (4)')
            expect(result).toEqual({ key: 'Schwer', parameters: [4] })
        })

        it('should parse eigenschaft with multiple parameters (semicolon separated)', () => {
            const result = parseEigenschaftString('Umklammern (-2; 12)')
            expect(result).toEqual({ key: 'Umklammern', parameters: [-2, 12] })
        })

        it('should parse eigenschaft with nested parentheses', () => {
            const result = parseEigenschaftString('Fernkampfoption (Dolch (Kurze Wurfwaffen))')
            expect(result).toEqual({
                key: 'Fernkampfoption',
                parameters: ['Dolch (Kurze Wurfwaffen)'],
            })
        })

        it('should handle plus sign in parameter', () => {
            const result = parseEigenschaftString('Niederwerfen (+4)')
            expect(result).toEqual({ key: 'Niederwerfen', parameters: [4] })
        })

        it('should handle ± sign in parameter', () => {
            const result = parseEigenschaftString('Umklammern (±2/12)')
            // ± is stripped, / is kept as part of string since not semicolon
            expect(result).toEqual({ key: 'Umklammern', parameters: ['2/12'] })
        })

        it('should parse alternative semicolon format for Umklammern', () => {
            const result = parseEigenschaftString('Umklammern (±2; 12)')
            expect(result).toEqual({ key: 'Umklammern', parameters: [2, 12] })
        })

        it('should handle whitespace variations', () => {
            const result1 = parseEigenschaftString('  Schwer  (  4  )  ')
            expect(result1).toEqual({ key: 'Schwer', parameters: [4] })

            const result2 = parseEigenschaftString('Schwer(4)')
            expect(result2).toEqual({ key: 'Schwer', parameters: [4] })
        })

        it('should return null for empty input', () => {
            expect(parseEigenschaftString('')).toBeNull()
            expect(parseEigenschaftString('  ')).toBeNull()
            expect(parseEigenschaftString(null)).toBeNull()
            expect(parseEigenschaftString(undefined)).toBeNull()
        })

        it('should handle string parameters', () => {
            const result = parseEigenschaftString('Speziell (Bonus gegen Untote)')
            expect(result).toEqual({ key: 'Speziell', parameters: ['Bonus gegen Untote'] })
        })

        it('should parse Leicht with numeric parameter', () => {
            const result = parseEigenschaftString('Leicht (2)')
            expect(result).toEqual({ key: 'Leicht', parameters: [2] })
        })

        it('should parse Messerstecherei without parameters', () => {
            const result = parseEigenschaftString('Messerstecherei')
            expect(result).toEqual({ key: 'Messerstecherei', parameters: [] })
        })
    })

    describe('parseEigenschaftenArray', () => {
        it('should parse array of eigenschaft strings', () => {
            const input = [
                'Leicht (2)',
                'Messerstecherei',
                'Fernkampfoption (Borndorn (Kurze Wurfwaffen))',
            ]
            const result = parseEigenschaftenArray(input)
            expect(result).toEqual([
                { key: 'Leicht', parameters: [2] },
                { key: 'Messerstecherei', parameters: [] },
                { key: 'Fernkampfoption', parameters: ['Borndorn (Kurze Wurfwaffen)'] },
            ])
        })

        it('should filter out null results', () => {
            const input = ['Schwer (4)', '', 'Zweihändig']
            const result = parseEigenschaftenArray(input)
            expect(result).toEqual([
                { key: 'Schwer', parameters: [4] },
                { key: 'Zweihändig', parameters: [] },
            ])
        })

        it('should return empty array for non-array input', () => {
            expect(parseEigenschaftenArray(null)).toEqual([])
            expect(parseEigenschaftenArray(undefined)).toEqual([])
            expect(parseEigenschaftenArray('string')).toEqual([])
        })

        it('should return empty array for empty array', () => {
            expect(parseEigenschaftenArray([])).toEqual([])
        })
    })

    describe('formatEigenschaftDisplay', () => {
        it('should format eigenschaft without parameters', () => {
            const result = formatEigenschaftDisplay({ key: 'Zweihändig', parameters: [] })
            expect(result).toBe('Zweihändig')
        })

        it('should format eigenschaft with single parameter', () => {
            const result = formatEigenschaftDisplay({ key: 'Schwer', parameters: [4] })
            expect(result).toBe('Schwer (4)')
        })

        it('should format eigenschaft with multiple parameters', () => {
            const result = formatEigenschaftDisplay({ key: 'Umklammern', parameters: [-2, 12] })
            expect(result).toBe('Umklammern (-2; 12)')
        })

        it('should format eigenschaft with string parameter', () => {
            const result = formatEigenschaftDisplay({
                key: 'Fernkampfoption',
                parameters: ['Dolch (Kurze Wurfwaffen)'],
            })
            expect(result).toBe('Fernkampfoption (Dolch (Kurze Wurfwaffen))')
        })

        it('should return empty string for invalid input', () => {
            expect(formatEigenschaftDisplay(null)).toBe('')
            expect(formatEigenschaftDisplay({})).toBe('')
            expect(formatEigenschaftDisplay({ key: '' })).toBe('')
        })
    })

    describe('isStructuredEigenschaft', () => {
        it('should return true for valid structured eigenschaft', () => {
            expect(isStructuredEigenschaft({ key: 'Schwer', parameters: [4] })).toBe(true)
            expect(isStructuredEigenschaft({ key: 'Zweihändig', parameters: [] })).toBe(true)
        })

        it('should return false for string eigenschaft', () => {
            expect(isStructuredEigenschaft('Schwer (4)')).toBe(false)
        })

        it('should return false for invalid objects', () => {
            expect(isStructuredEigenschaft(null)).toBe(false)
            expect(isStructuredEigenschaft(undefined)).toBe(false)
            expect(isStructuredEigenschaft({})).toBe(false)
            expect(isStructuredEigenschaft({ key: 'Schwer' })).toBe(false)
            expect(isStructuredEigenschaft({ parameters: [] })).toBe(false)
            expect(isStructuredEigenschaft({ key: 123, parameters: [] })).toBe(false)
        })
    })

    describe('normalizeEigenschaften', () => {
        it('should pass through already structured eigenschaften', () => {
            const input = [
                { key: 'Schwer', parameters: [4] },
                { key: 'Zweihändig', parameters: [] },
            ]
            const result = normalizeEigenschaften(input)
            expect(result).toEqual(input)
        })

        it('should convert string eigenschaften to structured format', () => {
            const input = ['Schwer (4)', 'Zweihändig']
            const result = normalizeEigenschaften(input)
            expect(result).toEqual([
                { key: 'Schwer', parameters: [4] },
                { key: 'Zweihändig', parameters: [] },
            ])
        })

        it('should handle mixed format arrays', () => {
            const input = [
                { key: 'Schwer', parameters: [4] },
                'Zweihändig',
                { key: 'Parierwaffe', parameters: [] },
            ]
            const result = normalizeEigenschaften(input)
            expect(result).toEqual([
                { key: 'Schwer', parameters: [4] },
                { key: 'Zweihändig', parameters: [] },
                { key: 'Parierwaffe', parameters: [] },
            ])
        })

        it('should return empty array for non-array input', () => {
            expect(normalizeEigenschaften(null)).toEqual([])
            expect(normalizeEigenschaften(undefined)).toEqual([])
        })
    })

    describe('extractEigenschaftKey', () => {
        it('should extract key from string eigenschaft', () => {
            expect(extractEigenschaftKey('Schwer (4)')).toBe('Schwer')
            expect(extractEigenschaftKey('Zweihändig')).toBe('Zweihändig')
        })

        it('should extract key from structured eigenschaft', () => {
            expect(extractEigenschaftKey({ key: 'Schwer', parameters: [4] })).toBe('Schwer')
            expect(extractEigenschaftKey({ key: 'Zweihändig', parameters: [] })).toBe('Zweihändig')
        })

        it('should return null for invalid input', () => {
            expect(extractEigenschaftKey(null)).toBeNull()
            expect(extractEigenschaftKey(undefined)).toBeNull()
            expect(extractEigenschaftKey({})).toBeNull()
        })
    })
})
