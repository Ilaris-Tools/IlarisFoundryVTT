import { ManoeverConverter } from '../manoever-converter.js'

describe('ManoeverConverter', () => {
    let converter

    beforeEach(() => {
        converter = new ManoeverConverter()
    })

    describe('parseProbe', () => {
        describe('input field determination', () => {
            it('should return NUMBER input when probe contains X', () => {
                const result = converter.parseProbe('VT -X')
                expect(result.input.field).toBe('NUMBER')
                expect(result.input.label).toBe('Number')
            })

            it('should return NUMBER input when probe contains lowercase x', () => {
                const result = converter.parseProbe('AT -x')
                expect(result.input.field).toBe('NUMBER')
                expect(result.input.label).toBe('Number')
            })

            it('should return CHECKBOX input when probe contains a fixed number', () => {
                const result = converter.parseProbe('AT +2')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.input.label).toBe('Checkbox')
            })

            it('should return CHECKBOX input when probe is empty', () => {
                const result = converter.parseProbe('')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.input.label).toBe('Checkbox')
            })

            it('should return CHECKBOX input when probe is null', () => {
                const result = converter.parseProbe(null)
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.input.label).toBe('Checkbox')
            })
        })

        describe('modification type determination', () => {
            it('should create DEFENCE modification for VT probe', () => {
                const result = converter.parseProbe('VT -X')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0].type).toBe('DEFENCE')
            })

            it('should create ATTACK modification for AT probe', () => {
                const result = converter.parseProbe('AT +2')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0].type).toBe('ATTACK')
            })

            it('should create ATTACK modification for FK probe', () => {
                const result = converter.parseProbe('FK +3')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0].type).toBe('ATTACK')
            })

            it('should handle case insensitive probe types', () => {
                const result1 = converter.parseProbe('vt -2')
                expect(result1.modifications[0].type).toBe('DEFENCE')

                const result2 = converter.parseProbe('at +2')
                expect(result2.modifications[0].type).toBe('ATTACK')

                const result3 = converter.parseProbe('fk +1')
                expect(result3.modifications[0].type).toBe('ATTACK')
            })
        })

        describe('simple probe patterns (VT -X, AT +2)', () => {
            it('should parse "VT -X" correctly', () => {
                const result = converter.parseProbe('VT -X')
                expect(result.input.field).toBe('NUMBER')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'DEFENCE',
                    value: 1,
                    operator: 'SUBTRACT',
                    affectedByInput: true,
                    target: '',
                })
            })

            it('should parse "AT +2" correctly', () => {
                const result = converter.parseProbe('AT +2')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'ATTACK',
                    value: 2,
                    operator: 'ADD',
                    affectedByInput: false,
                    target: '',
                })
            })

            it('should parse "VT -3" correctly', () => {
                const result = converter.parseProbe('VT -3')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'DEFENCE',
                    value: 3,
                    operator: 'SUBTRACT',
                    affectedByInput: false,
                    target: '',
                })
            })

            it('should parse "FK +1" correctly', () => {
                const result = converter.parseProbe('FK +1')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'ATTACK',
                    value: 1,
                    operator: 'ADD',
                    affectedByInput: false,
                    target: '',
                })
            })

            it('should parse "AT -X" correctly', () => {
                const result = converter.parseProbe('AT -X')
                expect(result.input.field).toBe('NUMBER')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'ATTACK',
                    value: 1,
                    operator: 'SUBTRACT',
                    affectedByInput: true,
                    target: '',
                })
            })

            it('should parse "VT +X" correctly', () => {
                const result = converter.parseProbe('VT +X')
                expect(result.input.field).toBe('NUMBER')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'DEFENCE',
                    value: 1,
                    operator: 'ADD',
                    affectedByInput: true,
                    target: '',
                })
            })
        })

        describe('complex probe patterns with properties (VT -2-BE)', () => {
            it('should parse "VT -2-BE" correctly', () => {
                const result = converter.parseProbe('VT -2-BE')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'DEFENCE',
                    value: 2,
                    operator: 'SUBTRACT',
                    affectedByInput: false,
                    target: 'actor.system.abgeleitete.be',
                })
            })

            it('should parse "AT +3-BE" correctly', () => {
                const result = converter.parseProbe('AT +3-BE')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'ATTACK',
                    value: 3,
                    operator: 'SUBTRACT',
                    affectedByInput: false,
                    target: 'actor.system.abgeleitete.be',
                })
            })

            it('should parse "VT -1-GS" correctly', () => {
                const result = converter.parseProbe('VT -1-GS')
                expect(result.input.field).toBe('CHECKBOX')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0]).toEqual({
                    type: 'DEFENCE',
                    value: 1,
                    operator: 'SUBTRACT',
                    affectedByInput: false,
                    target: 'actor.system.abgeleitete.gs',
                })
            })

            it('should handle property names in different cases', () => {
                const result = converter.parseProbe('VT -2-Be')
                expect(result.modifications[0].target).toBe('actor.system.abgeleitete.be')
            })

            it('should parse property with + operator', () => {
                const result = converter.parseProbe('AT +2+MR')
                expect(result.modifications[0]).toEqual({
                    type: 'ATTACK',
                    value: 2,
                    operator: 'ADD',
                    affectedByInput: false,
                    target: 'actor.system.abgeleitete.mr',
                })
            })
        })

        describe('edge cases', () => {
            it('should return empty modifications for probe without AT/VT/FK', () => {
                const result = converter.parseProbe('Special +2')
                expect(result.modifications.length).toBe(0)
            })

            it('should handle probe with only type (no number)', () => {
                const result = converter.parseProbe('VT')
                expect(result.modifications.length).toBe(0)
            })

            it('should handle whitespace in probe', () => {
                const result = converter.parseProbe('  VT  -2  ')
                expect(result.modifications.length).toBe(1)
                expect(result.modifications[0].value).toBe(2)
            })

            it('should handle probe with multiple digits', () => {
                const result = converter.parseProbe('AT +12')
                expect(result.modifications[0].value).toBe(12)
            })
        })
    })
})
