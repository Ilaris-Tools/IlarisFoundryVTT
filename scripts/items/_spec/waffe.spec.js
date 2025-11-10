// Mock global dependencies
global.game = {
    settings: {
        get: jest.fn().mockReturnValue('{}'),
    },
    items: [],
    packs: [],
}

global.CONFIG = {
    ILARIS: {},
}

global.foundry = {
    utils: {
        getProperty: (obj, path) => {
            return path.split('.').reduce((acc, part) => acc?.[part], obj)
        },
        deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    },
}

// Mock the parent classes
jest.mock('../combat.js', () => ({
    CombatItem: class MockCombatItem {
        constructor(data = {}) {
            this.name = data.name || 'Test Weapon'
            this.type = data.type || 'nahkampfwaffe'
            this.system = data.system || {}
            this.parent = null
        }
        prepareDerivedData() {}
    },
}))

// Import the actual class we want to test
const { WaffeItem } = require('../waffe.js')
const { checkCondition, compareValues, evaluateFormula } = require('../utils/eigenschaft-utils.js')

describe('WaffeItem', () => {
    let weapon
    let mockActor

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Create mock actor
        mockActor = {
            documentName: 'Actor',
            system: {
                attribute: {
                    KK: { wert: 8 },
                    KO: { wert: 6 },
                    GE: { wert: 5 },
                },
                abgeleitete: {
                    be: 2,
                },
            },
        }

        // Create weapon instance
        weapon = new WaffeItem({
            name: 'Test Sword',
            type: 'nahkampfwaffe',
            system: {
                wm_at: 0,
                wm_vt: 0,
                wm_fk: 0,
                rw: 1,
                hauptwaffe: true,
                nebenwaffe: false,
                eigenschaften: [],
                tp: '1W6',
            },
        })

        weapon.parent = mockActor
        weapon._eigenschaftCache.loaded = true
        weapon._eigenschaftCache.cache = new Map()
    })

    describe('getTp', () => {
        it('should return damage with d notation', () => {
            weapon.system.schaden = '2W6+3'
            expect(weapon.getTp()).toBe('2d6+3')
        })

        it('should convert W to d', () => {
            weapon.system.schaden = '1W6'
            expect(weapon.getTp()).toBe('1d6')
        })

        it('should handle lowercase w', () => {
            weapon.system.schaden = '3w10-2'
            expect(weapon.getTp()).toBe('3d10-2')
        })

        it('should return empty string if no schaden', () => {
            weapon.system.schaden = null
            expect(weapon.getTp()).toBe('')
        })
    })

    describe('prepareDerivedData', () => {
        it('should not calculate if not embedded in actor', () => {
            weapon.parent = null
            weapon.prepareDerivedData()
            expect(weapon.system.computed).toBeUndefined()
        })

        it('should not calculate if weapon is not selected', () => {
            weapon.system.hauptwaffe = false
            weapon.system.nebenwaffe = false
            weapon.prepareDerivedData()
            expect(weapon.system.computed).toBeUndefined()
        })

        it('should calculate stats for hauptwaffe', () => {
            weapon.system.hauptwaffe = true
            weapon.prepareDerivedData()
            expect(weapon.system.computed).toBeDefined()
        })

        it('should calculate stats for nebenwaffe', () => {
            weapon.system.hauptwaffe = false
            weapon.system.nebenwaffe = true
            weapon.prepareDerivedData()
            expect(weapon.system.computed).toBeDefined()
        })
    })

    describe('_calculateWeaponStats', () => {
        beforeEach(() => {
            weapon.system.wm_at = 2
            weapon.system.wm_vt = 1
            weapon.system.rw = 3
        })

        it('should initialize computed values correctly', () => {
            weapon._calculateWeaponStats()

            expect(weapon.system.computed).toEqual({
                at: 0, // 2 (wm_at) - 2 (BE)
                vt: -1, // 1 (wm_vt) - 2 (BE)
                fk: -2, // 0 (wm_fk) - 2 (BE)
                schadenBonus: 0,
                rw: 3,
                penalties: ['BE: -2'],
                targetEffects: [],
                combatMechanics: {},
                conditionalModifiers: [],
                hasActorModifiers: false,
            })
        })

        it('should apply BE penalty', () => {
            mockActor.system.abgeleitete.be = 4
            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(-2) // 2 - 4
            expect(weapon.system.computed.vt).toBe(-3) // 1 - 4
            expect(weapon.system.computed.penalties).toContain('BE: -4')
        })

        it('should not add penalty message if BE is 0', () => {
            mockActor.system.abgeleitete.be = 0
            weapon._calculateWeaponStats()

            expect(weapon.system.computed.penalties).toEqual([])
        })

        it('should handle undefined BE gracefully', () => {
            mockActor.system.abgeleitete.be = undefined
            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(2)
            expect(weapon.system.computed.vt).toBe(1)
        })
    })

    describe('integration: complex weapon with multiple eigenschaften', () => {
        beforeEach(() => {
            weapon.system.wm_at = 1
            weapon.system.wm_vt = 0
            weapon.system.eigenschaften = ['Kopflastig', 'Zweihändig', 'Schwer (4)']

            // Mock Kopflastig
            weapon._eigenschaftCache.cache.set('Kopflastig', {
                name: 'Kopflastig',
                type: 'waffeneigenschaft',
                system: {
                    kategorie: 'modifier',
                    modifiers: {
                        schadenFormula: '@actor.system.attribute.KK.wert',
                    },
                },
            })

            // Mock Zweihändig
            weapon._eigenschaftCache.cache.set('Zweihändig', {
                name: 'Zweihändig',
                type: 'waffeneigenschaft',
                system: {
                    kategorie: 'wielding',
                    wieldingRequirements: {
                        hands: 2,
                        penalties: {
                            hauptOnly: { at: 0, vt: -2 },
                        },
                    },
                },
            })

            // Mock Schwer (4)
            weapon._eigenschaftCache.cache.set('Schwer (4)', {
                name: 'Schwer (4)',
                type: 'waffeneigenschaft',
                system: {
                    kategorie: 'modifier',
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
                },
            })
        })

        it('should correctly calculate all bonuses and penalties', () => {
            weapon._calculateWeaponStats()

            // AT: 1 (base) + 0 (Schwer, KK >= 4) + 0 (Zweihändig as hauptOnly) - 2 (BE) = -1
            // VT: 0 (base) + 0 (Schwer, KK >= 4) - 2 (Zweihändig as hauptOnly) - 2 (BE) = -4
            // Damage: 8 (Kopflastig: KK.wert)
            expect(weapon.system.computed.at).toBe(-1)
            expect(weapon.system.computed.vt).toBe(-4)
            expect(weapon.system.computed.schadenBonus).toBe(8)
            expect(weapon.system.computed.penalties).toContain('BE: -2')
        })
    })
})
