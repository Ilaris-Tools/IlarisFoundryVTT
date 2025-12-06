const { ProcessorFactory } = require('../processor-factory.js')
const { ModifierProcessor } = require('../modifier-processor.js')
const { WieldingProcessor } = require('../wielding-processor.js')
const { TargetEffectProcessor } = require('../target-effect-processor.js')
const { PassiveProcessor } = require('../passive-processor.js')
const { ActorModifierProcessor } = require('../actor-modifier-processor.js')

// Mock global dependencies
global.foundry = {
    utils: {
        getProperty: (obj, path) => {
            return path.split('.').reduce((acc, part) => acc?.[part], obj)
        },
    },
}

describe('ProcessorFactory', () => {
    let factory

    beforeEach(() => {
        factory = new ProcessorFactory()
    })

    describe('constructor', () => {
        it('should register all processor classes', () => {
            expect(factory.processors.size).toBe(5)
        })
    })

    describe('getProcessor', () => {
        it('should return ModifierProcessor for "modifier" kategorie', () => {
            const processor = factory.getProcessor('modifier')
            expect(processor).toBeInstanceOf(ModifierProcessor)
        })

        it('should return WieldingProcessor for "wielding" kategorie', () => {
            const processor = factory.getProcessor('wielding')
            expect(processor).toBeInstanceOf(WieldingProcessor)
        })

        it('should return TargetEffectProcessor for "target_effect" kategorie', () => {
            const processor = factory.getProcessor('target_effect')
            expect(processor).toBeInstanceOf(TargetEffectProcessor)
        })

        it('should return PassiveProcessor for "passive" kategorie', () => {
            const processor = factory.getProcessor('passive')
            expect(processor).toBeInstanceOf(PassiveProcessor)
        })

        it('should return ActorModifierProcessor for "actor_modifier" kategorie', () => {
            const processor = factory.getProcessor('actor_modifier')
            expect(processor).toBeInstanceOf(ActorModifierProcessor)
        })

        it('should return null for unknown kategorie', () => {
            const processor = factory.getProcessor('unknown')
            expect(processor).toBeNull()
        })
    })

    describe('process', () => {
        let computed
        let mockActor
        let mockWeapon

        beforeEach(() => {
            computed = {
                at: 0,
                vt: 0,
                schadenBonus: 0,
                rw: 0,
                penalties: [],
                targetEffects: [],
                combatMechanics: {},
                conditionalModifiers: [],
                hasActorModifiers: false,
            }

            mockActor = {
                system: {
                    attribute: {
                        KK: { wert: 8 },
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

        it('should process modifier eigenschaft', () => {
            const eigenschaft = {
                modifiers: {
                    at: 2,
                },
            }

            factory.process('modifier', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(2)
        })

        it('should process wielding eigenschaft', () => {
            const eigenschaft = {
                wieldingRequirements: {
                    hands: 2,
                    penalties: {
                        hauptOnly: { at: 0, vt: -2 },
                    },
                },
            }

            factory.process('wielding', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.vt).toBe(-2)
        })

        it('should process target_effect eigenschaft', () => {
            const eigenschaft = {
                targetEffect: {
                    name: 'Test Effect',
                    trigger: 'on_hit',
                },
            }

            factory.process('target_effect', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.targetEffects).toHaveLength(1)
        })

        it('should process combat_mechanic eigenschaft', () => {
            const eigenschaft = {
                combatMechanics: {
                    fumbleThreshold: 1,
                },
            }

            factory.process('combat_mechanic', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.combatMechanics.fumbleThreshold).toBe(1)
        })

        it('should process passive eigenschaft', () => {
            const eigenschaft = {}

            factory.process('passive', eigenschaft, computed, mockActor, mockWeapon)

            // Passive does nothing, just checking it doesn't throw
            expect(computed.at).toBe(0)
        })

        it('should process actor_modifier eigenschaft', () => {
            const eigenschaft = {}

            factory.process('actor_modifier', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.hasActorModifiers).toBe(true)
        })

        it('should execute custom script for unknown kategorie', () => {
            const eigenschaft = {
                customScript: 'computed.at += 10',
            }

            factory.process('unknown_kategorie', eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.at).toBe(10)
        })

        it('should warn for unknown kategorie without custom script', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
            const eigenschaft = {}

            factory.process('unknown_kategorie', eigenschaft, computed, mockActor, mockWeapon)

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'No processor found for kategorie: unknown_kategorie',
            )
            consoleWarnSpy.mockRestore()
        })
    })
})
