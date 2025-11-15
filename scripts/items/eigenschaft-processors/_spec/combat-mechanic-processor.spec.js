const { CombatMechanicProcessor } = require('../combat-mechanic-processor.js')

describe('CombatMechanicProcessor', () => {
    let processor
    let computed
    let mockActor
    let mockWeapon

    beforeEach(() => {
        processor = new CombatMechanicProcessor()

        computed = {
            combatMechanics: {},
            conditionalModifiers: [],
        }

        mockActor = {}
        mockWeapon = {}
    })

    describe('getKategorie', () => {
        it('should return "combat_mechanic"', () => {
            expect(CombatMechanicProcessor.getKategorie()).toBe('combat_mechanic')
        })
    })

    describe('process', () => {
        it('should apply fumble threshold', () => {
            const eigenschaft = {
                combatMechanics: {
                    fumbleThreshold: 1,
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics.fumbleThreshold).toBe(1)
        })

        it('should apply crit threshold', () => {
            const eigenschaft = {
                combatMechanics: {
                    critThreshold: 19,
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics.critThreshold).toBe(19)
        })

        it('should apply ignoreCover flag', () => {
            const eigenschaft = {
                combatMechanics: {
                    ignoreCover: true,
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics.ignoreCover).toBe(true)
        })

        it('should apply ignoreArmor flag', () => {
            const eigenschaft = {
                combatMechanics: {
                    ignoreArmor: true,
                },
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics.ignoreArmor).toBe(true)
        })

        it('should accumulate additionalDice', () => {
            const eigenschaft1 = {
                combatMechanics: {
                    additionalDice: 2,
                },
            }
            const eigenschaft2 = {
                combatMechanics: {
                    additionalDice: 1,
                },
            }

            processor.process(eigenschaft1, computed, mockActor, mockWeapon)
            processor.process(eigenschaft2, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics.additionalDice).toBe(3)
        })

        it('should register conditional modifiers', () => {
            const eigenschaft = {
                conditionalModifiers: [
                    { trigger: 'vs_shield', bonus: 4 },
                    { trigger: 'vs_armor', bonus: 2 },
                ],
            }

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.conditionalModifiers).toHaveLength(2)
            expect(computed.conditionalModifiers[0].trigger).toBe('vs_shield')
            expect(computed.conditionalModifiers[1].trigger).toBe('vs_armor')
        })

        it('should handle eigenschaft with no mechanics', () => {
            const eigenschaft = {}

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics).toEqual({})
            expect(computed.conditionalModifiers).toEqual([])
        })
    })
})
