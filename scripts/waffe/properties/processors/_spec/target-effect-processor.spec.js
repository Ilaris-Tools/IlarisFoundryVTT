const { TargetEffectProcessor } = require('../target-effect-processor.js')

describe('TargetEffectProcessor', () => {
    let processor
    let computed
    let mockActor
    let mockWeapon

    beforeEach(() => {
        processor = new TargetEffectProcessor()

        computed = {
            targetEffects: [],
        }

        mockActor = {}
        mockWeapon = {}
    })

    describe('getKategorie', () => {
        it('should return "target_effect"', () => {
            expect(TargetEffectProcessor.getKategorie()).toBe('target_effect')
        })
    })

    describe('process', () => {
        it('should register target effect', () => {
            const eigenschaft = {
                targetEffect: {
                    name: 'Niederwerfen',
                    trigger: 'on_hit',
                    resistCheck: {
                        attribute: 'KK',
                        difficulty: 0,
                    },
                    effect: {
                        type: 'condition',
                        value: 'Liegend',
                    },
                },
            }

            processor.process('niederwerfen', eigenschaft, [], computed, mockActor, mockWeapon)

            expect(computed.targetEffects).toHaveLength(1)
            expect(computed.targetEffects[0].name).toBe('Niederwerfen')
            expect(computed.targetEffects[0].trigger).toBe('on_hit')
            expect(computed.targetEffects[0].resistCheck.attribute).toBe('KK')
            expect(computed.targetEffects[0].effect.type).toBe('condition')
        })

        it('should not register if no targetEffect', () => {
            const eigenschaft = {}

            processor.process(eigenschaft, computed, mockActor, mockWeapon)

            expect(computed.targetEffects).toHaveLength(0)
        })

        it('should register multiple target effects from different eigenschaften', () => {
            const eigenschaft1 = {
                targetEffect: {
                    name: 'Niederwerfen',
                    trigger: 'on_hit',
                    effect: { type: 'condition' },
                },
            }
            const eigenschaft2 = {
                targetEffect: {
                    name: 'Bleed',
                    trigger: 'on_crit',
                    effect: { type: 'damage' },
                },
            }

            processor.process('niederwerfen', eigenschaft1, [], computed, mockActor, mockWeapon)
            processor.process('bleed', eigenschaft2, [], computed, mockActor, mockWeapon)

            expect(computed.targetEffects).toHaveLength(2)
            expect(computed.targetEffects[0].name).toBe('Niederwerfen')
            expect(computed.targetEffects[1].name).toBe('Bleed')
        })
    })
})
