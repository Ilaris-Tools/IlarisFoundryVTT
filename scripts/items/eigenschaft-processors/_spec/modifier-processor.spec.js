// Mock global dependencies
global.foundry = {
    utils: {
        getProperty: (obj, path) => {
            return path.split('.').reduce((acc, part) => acc?.[part], obj)
        },
    },
}

const { ModifierProcessor } = require('../modifier-processor.js')

describe('ModifierProcessor', () => {
    let processor
    let computed
    let mockActor
    let mockWeapon

    beforeEach(() => {
        processor = new ModifierProcessor()

        computed = {
            at: 0,
            vt: 0,
            schadenBonus: 0,
            rw: 0,
            penalties: [],
        }

        mockActor = {
            system: {
                attribute: {
                    KK: { wert: 8 },
                    KO: { wert: 6 },
                    GE: { wert: 5 },
                },
            },
        }

        mockWeapon = {
            system: {
                hauptwaffe: true,
                nebenwaffe: false,
            },
        }
    })

    describe('getKategorie', () => {
        it('should return "modifier"', () => {
            expect(ModifierProcessor.getKategorie()).toBe('modifier')
        })
    })

    describe('process', () => {
        it('should apply simple numeric modifiers', () => {
            const eigenschaft = {
                modifiers: {
                    at: 2,
                    vt: 1,
                    schaden: 3,
                    rw: 5,
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(2)
            expect(computed.vt).toBe(1)
            expect(computed.schadenBonus).toBe(3)
            expect(computed.rw).toBe(5)
        })

        it('should evaluate schadenFormula', () => {
            const eigenschaft = {
                modifiers: {
                    schadenFormula: '@actor.system.attribute.KK.wert',
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.schadenBonus).toBe(8) // KK.wert = 8
        })

        it('should combine numeric and formula modifiers', () => {
            const eigenschaft = {
                modifiers: {
                    at: 1,
                    schaden: 2,
                    schadenFormula: '@actor.system.attribute.KK.wert',
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(1)
            expect(computed.schadenBonus).toBe(10) // 2 + 8 (KK)
        })

        it('should not apply penalties when condition is not met', () => {
            const eigenschaft = {
                modifiers: {},
                conditions: [
                    {
                        type: 'attribute_check',
                        attribute: 'KK',
                        operator: '<',
                        value: 4,
                        onFailure: {
                            at: -2,
                            vt: -2,
                            message: 'KK < 4: -2 AT/VT',
                        },
                    },
                ],
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            // KK is 8, so condition is false (8 is not < 4), no penalties
            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(0)
            expect(computed.penalties).toEqual([])
        })

        it('should apply penalties when condition is met', () => {
            mockActor.system.attribute.KK.wert = 3

            const eigenschaft = {
                modifiers: {},
                conditions: [
                    {
                        type: 'attribute_check',
                        attribute: 'KK',
                        operator: '<',
                        value: 4,
                        onFailure: {
                            at: -2,
                            vt: -2,
                            message: 'KK < 4: -2 AT/VT',
                        },
                    },
                ],
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            // KK is 3, so condition is true (3 < 4), apply penalties
            expect(computed.at).toBe(-2)
            expect(computed.vt).toBe(-2)
            expect(computed.penalties).toContain('KK < 4: -2 AT/VT')
        })

        it('should handle multiple conditions', () => {
            mockActor.system.attribute.KK.wert = 3
            mockActor.system.attribute.GE.wert = 2

            const eigenschaft = {
                modifiers: {},
                conditions: [
                    {
                        type: 'attribute_check',
                        attribute: 'KK',
                        operator: '<',
                        value: 4,
                        onFailure: {
                            at: -1,
                            message: 'Low KK',
                        },
                    },
                    {
                        type: 'attribute_check',
                        attribute: 'GE',
                        operator: '<',
                        value: 3,
                        onFailure: {
                            vt: -1,
                            message: 'Low GE',
                        },
                    },
                ],
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(-1)
            expect(computed.vt).toBe(-1)
            expect(computed.penalties).toContain('Low KK')
            expect(computed.penalties).toContain('Low GE')
        })

        it('should handle eigenschaft with no modifiers or conditions', () => {
            const eigenschaft = {}

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(0)
            expect(computed.schadenBonus).toBe(0)
        })
    })
})
