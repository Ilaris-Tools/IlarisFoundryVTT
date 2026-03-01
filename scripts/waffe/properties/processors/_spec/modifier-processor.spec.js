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
            modifiers: {
                at: [],
                vt: [],
                dmg: [],
            },
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

            processor.process('simple', eigenschaft, [], computed, mockActor, mockWeapon)

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

            processor.process('schadenformula', eigenschaft, [], computed, mockActor, mockWeapon)

            expect(computed.schadenBonus).toBe(2) // KK.wert = 8/4 = 2
        })

        it('should combine numeric and formula modifiers', () => {
            const eigenschaft = {
                modifiers: {
                    at: 1,
                    schaden: 2,
                    schadenFormula: '@actor.system.attribute.KK.wert',
                },
            }

            processor.process('combined', eigenschaft, [], computed, mockActor, mockWeapon)

            expect(computed.at).toBe(1)
            expect(computed.schadenBonus).toBe(4) // 2 + 8/4 (KK)
        })

        it('should handle eigenschaft with no modifiers or conditions', () => {
            const eigenschaft = {}

            processor.process('combined', eigenschaft, [], computed, mockActor, mockWeapon)

            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(0)
            expect(computed.schadenBonus).toBe(0)
        })
    })
})
