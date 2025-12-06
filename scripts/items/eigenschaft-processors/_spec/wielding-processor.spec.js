const { WieldingProcessor } = require('../wielding-processor.js')

describe('WieldingProcessor', () => {
    let processor
    let computed
    let mockActor
    let mockWeapon

    beforeEach(() => {
        processor = new WieldingProcessor()

        computed = {
            at: 0,
            vt: 0,
            schadenBonus: 0,
            modifiers: {
                at: [],
                vt: [],
                dmg: [],
            },
        }

        mockActor = {}

        mockWeapon = {
            system: {
                hauptwaffe: true,
                nebenwaffe: false,
                eigenschaften: [],
            },
        }
    })

    describe('getKategorie', () => {
        it('should return "wielding"', () => {
            expect(WieldingProcessor.getKategorie()).toBe('wielding')
        })
    })

    describe('process', () => {
        it('should not apply penalties for non-nebenwaffe one-handed weapons', () => {
            const eigenschaft = {
                wieldingRequirements: {
                    hands: 1,
                },
            }
            mockWeapon.system.hauptwaffe = true
            mockWeapon.system.nebenwaffe = false
            processor.process('eigenschaft', eigenschaft, computed, mockActor, mockWeapon)
            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(0)
        })

        it('should apply hauptOnly penalties', () => {
            mockWeapon.system.hauptwaffe = true
            mockWeapon.system.nebenwaffe = false

            const eigenschaft = {
                wieldingRequirements: {
                    hands: 2,
                    penalties: {
                        hauptOnly: { at: 0, vt: -2, message: 'Only main hand' },
                    },
                },
            }

            processor.process('Only main hand', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(-2)
            expect(computed.modifiers.vt).toContain('Only main hand: -2')
        })

        it('should apply nebenOnly penalties', () => {
            mockWeapon.system.hauptwaffe = false
            mockWeapon.system.nebenwaffe = true

            const eigenschaft = {
                wieldingRequirements: {
                    hands: 2,
                    penalties: {
                        nebenOnly: { at: -4, vt: -4, message: 'Only off hand' },
                    },
                },
            }

            processor.process('Only off hand', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(-4)
            expect(computed.vt).toBe(-4)
            expect(computed.modifiers.vt).toContain('Only off hand: -4')
            expect(computed.modifiers.at).toContain('Only off hand: -4')
        })

        it('should not apply penalties for two-handed weapon used in both hands', () => {
            mockWeapon.system.hauptwaffe = true
            mockWeapon.system.nebenwaffe = true

            const eigenschaft = {
                wieldingRequirements: {
                    hands: 2,
                    penalties: {
                        hauptOnly: { at: 0, vt: -2 },
                        nebenOnly: { at: -4, vt: -4 },
                    },
                },
            }

            processor.process('eigenschaft', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(0)
        })

        it('should skip nebenWithoutExemption penalty if weapon has ignoreNebenMalus flag', () => {
            mockWeapon.system.hauptwaffe = false
            mockWeapon.system.nebenwaffe = false
            // Simulate computed.ignoreNebenMalus set by processor
            computed.ignoreNebenMalus = true

            const eigenschaft = {
                wieldingRequirements: {
                    hands: 2,
                    penalties: {
                        nebenWithoutExemption: { at: -4, vt: -4 },
                    },
                },
            }

            processor.process('eigenschaft', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(0)
            expect(computed.vt).toBe(0)
        })
    })
})
