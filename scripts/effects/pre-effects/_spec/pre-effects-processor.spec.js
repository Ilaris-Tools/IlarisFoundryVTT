/**
 * Tests for toArray() — Foundry V14 ObjectField normalization
 *
 * @spec openspec/changes/add-pre-effect-unit-tests/specs/pre-effect-unit-tests/spec.md
 */
import { toArray } from '../pre-effects-processor.js'

describe('toArray', () => {
    it('returns array unchanged when input is already an array', () => {
        const input = [{ a: 1 }, { b: 2 }]
        const result = toArray(input)

        // Same reference returned (pass-through)
        expect(result).toBe(input)
        expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('normalizes ObjectField {0:{a}, 1:{b}} to array [{a}, {b}]', () => {
        const input = { 0: { a: 1 }, 1: { b: 2 } }
        const result = toArray(input)

        expect(Array.isArray(result)).toBe(true)
        expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('returns empty array for null', () => {
        expect(toArray(null)).toEqual([])
    })

    it('returns empty array for undefined', () => {
        expect(toArray(undefined)).toEqual([])
    })

    it('returns empty array for empty object', () => {
        expect(toArray({})).toEqual([])
    })
})
