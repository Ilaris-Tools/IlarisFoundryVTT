import { DEFAULT_DAMAGE_TYPES, normalizeDamageType } from '../damage-types.js'

describe('damage-type defaults and editing', () => {
    it('authors every default elemental side effect explicitly', () => {
        expect(DEFAULT_DAMAGE_TYPES).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    value: 'FEUER',
                    behavior: expect.objectContaining({ elementalSideEffect: 'nachbrennen' }),
                }),
            ]),
        )
        for (const type of DEFAULT_DAMAGE_TYPES) {
            expect(type.behavior).toHaveProperty('elementalSideEffect')
            if (type.value !== 'FEUER') expect(type.behavior.elementalSideEffect).toBeNull()
        }
    })

    it('preserves a named side effect and clears an empty editor value to null', () => {
        expect(
            normalizeDamageType({ value: 'FEUER', label: 'Feuer', elementalSideEffect: 'frost' }),
        ).toEqual(
            expect.objectContaining({
                behavior: expect.objectContaining({ elementalSideEffect: 'frost' }),
            }),
        )
        expect(
            normalizeDamageType({ value: 'FEUER', label: 'Feuer', elementalSideEffect: '  ' }),
        ).toEqual(
            expect.objectContaining({
                behavior: expect.objectContaining({ elementalSideEffect: null }),
            }),
        )
    })
})
