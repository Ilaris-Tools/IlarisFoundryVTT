// Mock global dependencies
global.game = {
    settings: {
        get: jest.fn().mockReturnValue('{}'),
    },
    items: [],
    packs: [],
    actors: [],
}

global.CONFIG = {
    ILARIS: {},
}

global.foundry = {
    utils: {
        getProperty: (obj, path) => {
            return path.split('.').reduce((acc, part) => acc?.[part], obj)
        },
        deepClone: (obj) => ({
            vlof: {
                selected: false,
                offensiver_kampfstil: false,
            },
        }),
        mergeObject: (target, source) => Object.assign({}, target, source),
    },
}

// Mock Foundry VTT base classes
global.FormApplication = class FormApplication {
    static get defaultOptions() {
        return {}
    }
}

global.Application = class Application {
    static get defaultOptions() {
        return {}
    }
}

// Mock Hooks API
const Hooks = {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    call: jest.fn(),
    callAll: jest.fn(),
}
global.Hooks = Hooks

// Mock the parent classes
jest.mock('../combat.js', () => ({
    CombatItem: class MockCombatItem {
        constructor(data = {}) {
            this.name = data.name || 'Test Weapon'
            this.type = data.type || 'nahkampfwaffe'
            this.system = data.system || {}
            this.parent = null
        }
        prepareWeapon() {}
    },
}))

// Mock eigenschaft-cache to avoid Hooks dependency
jest.mock('../utils/eigenschaft-cache.js', () => ({
    EigenschaftCache: class MockEigenschaftCache {
        constructor() {
            this.loaded = false
            this.cache = new Map()
            this._requiredNames = []
            this._loading = false
        }
        async load(eigenschaftNames) {
            this.loaded = true
            return []
        }
        get(name) {
            return this.cache.get(name)
        }
        clear() {
            this.cache.clear()
            this.loaded = false
        }
    },
    preloadAllEigenschaften: jest.fn().mockResolvedValue(undefined),
}))

// Import the actual class we want to test
const { WaffeItem } = require('../waffe.js')

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
            items: [],
            vorteil: {
                kampf: [],
                allgemein: [],
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
                mod_at: 0,
                mod_vt: 0,
                mod_fk: 0,
                rw: 1,
                hauptwaffe: true,
                nebenwaffe: false,
                eigenschaften: [],
                tp: '1W6',
            },
        })

        weapon.parent = mockActor
        weapon.getPWFromActor = jest.fn().mockReturnValue(0)
        weapon._eigenschaftCache = {
            loaded: true,
            cache: new Map(),
            isLoaded: jest.fn().mockReturnValue(true),
            load: jest.fn().mockResolvedValue([]),
            get: jest.fn((name) => weapon._eigenschaftCache.cache.get(name)),
        }
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

    describe('prepareWeapon', () => {
        it('should not calculate if not embedded in actor', () => {
            weapon.parent = null
            weapon.prepareWeapon()
            expect(weapon.system.computed).toBeUndefined()
        })

        it('should calculate stats for hauptwaffe', () => {
            weapon.system.hauptwaffe = true
            weapon.prepareWeapon()
            expect(weapon.system.computed).toBeDefined()
        })

        it('should calculate stats for nebenwaffe', () => {
            weapon.system.hauptwaffe = false
            weapon.system.nebenwaffe = true
            weapon.prepareWeapon()
            expect(weapon.system.computed).toBeDefined()
        })
    })

    describe('_calculateWeaponStats', () => {
        beforeEach(() => {
            weapon.system.wm_at = 2
            weapon.system.wm_vt = 1
            weapon.system.wm_fk = 0
            weapon.system.mod_at = 0
            weapon.system.mod_vt = 0
            weapon.system.mod_fk = 0
            weapon.system.rw = 3
            weapon.getPWFromActor = jest.fn().mockReturnValue(0)
        })

        it('should initialize computed values correctly', () => {
            // First verify the beforeEach override worked
            expect(weapon.system.wm_at).toBe(2)
            expect(weapon.system.wm_vt).toBe(1)
            expect(weapon.system.wm_fk).toBe(0)
            expect(weapon.system.mod_at).toBe(0)
            expect(weapon.system.mod_vt).toBe(0)
            expect(weapon.system.mod_fk).toBe(0)

            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(0) // 2 (wm_at) + 0 (pw) + 0 (mod_at) - 2 (BE)
            expect(weapon.system.computed.vt).toBe(-1) // 1 (wm_vt) + 0 (pw) + 0 (mod_vt) - 2 (BE)
            expect(weapon.system.computed.fk).toBe(-2) // 0 (wm_fk) + 0 (pw) + 0 (mod_fk) - 2 (BE)
            expect(weapon.system.computed.schadenBonus).toBe(2) // SB from KK 8: floor(8/4) = 2
            expect(weapon.system.computed.rw).toBe(3)
            expect(weapon.system.computed.handsRequired).toBe(1)
            expect(weapon.system.computed.ignoreNebenMalus).toBe(false)
            expect(weapon.system.computed.noRider).toBe(false)

            // Check modifiers include WM
            expect(weapon.system.computed.modifiers.at).toEqual(
                expect.arrayContaining(['WM: 2', 'BE: -2']),
            )
            expect(weapon.system.computed.modifiers.vt).toEqual(
                expect.arrayContaining(['WM: 1', 'BE: -2']),
            )
            expect(weapon.system.computed.modifiers.dmg).toEqual(
                expect.arrayContaining(['TP: 1W6', 'SB: +2']),
            )
        })

        it('should apply BE penalty', () => {
            mockActor.system.abgeleitete.be = 4
            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(-2) // 2 - 4
            expect(weapon.system.computed.vt).toBe(-3) // 1 - 4
            expect(weapon.system.computed.modifiers.at).toContain('BE: -4')
            expect(weapon.system.computed.modifiers.vt).toContain('BE: -4')
        })

        it('should not add BE modifier message if BE is 0', () => {
            mockActor.system.abgeleitete.be = 0
            weapon._calculateWeaponStats()

            expect(weapon.system.computed).toBeDefined()
            expect(weapon.system.computed.modifiers).toBeDefined()
            expect(weapon.system.computed.modifiers.at).toBeDefined()
            const beModifiers = weapon.system.computed.modifiers.at.filter((m) =>
                m.startsWith('BE:'),
            )
            expect(beModifiers.length).toBe(0)
        })

        it('should handle undefined BE gracefully', () => {
            mockActor.system.abgeleitete.be = undefined

            // Debug: check values before calculation
            expect(weapon.system.wm_at).toBe(2)
            expect(weapon.system.mod_at).toBe(0)

            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(2) // wm_at only
            expect(weapon.system.computed.vt).toBe(1) // wm_vt only
        })

        it('should calculate Schadenbonus from KK', () => {
            mockActor.system.attribute.KK.wert = 12
            weapon._calculateWeaponStats()

            // SB = floor(12/4) = 3
            expect(weapon.system.computed.schadenBonus).toBe(3)
            expect(weapon.system.computed.modifiers.dmg).toContain('SB: +3')
        })

        it('should apply wound penalties if present', () => {
            mockActor.system.gesundheit = {
                wundabzuege: 2,
                wundenignorieren: 0,
            }
            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(-2) // 2 - 2 (BE) - 2 (wounds)
            expect(weapon.system.computed.vt).toBe(-3) // 1 - 2 (BE) - 2 (wounds)
            expect(weapon.system.computed.modifiers.at).toContain('Wunden: -2')
        })

        it('should not apply wound penalties if wundenignorieren is set', () => {
            mockActor.system.gesundheit = {
                wundabzuege: 2,
                wundenignorieren: 1,
            }
            weapon._calculateWeaponStats()

            expect(weapon.system.computed.at).toBe(0) // 2 - 2 (BE only, no wound penalty)
            const woundModifiers = weapon.system.computed.modifiers.at.filter((m) =>
                m.startsWith('Wunden:'),
            )
            expect(woundModifiers.length).toBe(0)
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

            // Mock Zweihändig, but bit different
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
                    wieldingRequirements: {
                        hands: 1,
                        penalties: {},
                        condition: {
                            type: 'attribute_check',
                            attribute: 'KK',
                            operator: '<',
                            value: 4,
                            onFailure: {
                                at: -2,
                                vt: -2,
                                schaden: 0,
                            },
                        },
                    },
                },
            })
        })

        it('should correctly calculate all bonuses and penalties', () => {
            weapon._calculateWeaponStats()

            // AT: 1 (base) + 0 (Schwer, KK >= 4) + 0 (Zweihändig as hauptOnly) - 2 (BE) = -1
            // VT: 0 (base) + 0 (Schwer, KK >= 4) - 2 (Zweihändig as hauptOnly) - 2 (BE) = -4
            // Damage: 0 (Kopflastig: KK.wert/4, SB: KK.wert/4, Zweihändig as hauptonly: -4)
            expect(weapon.system.computed.at).toBe(-1)
            expect(weapon.system.computed.vt).toBe(-4)
            expect(weapon.system.computed.schadenBonus).toBe(0)
            expect(weapon.system.computed.modifiers.at).toContain('BE: -2')
            expect(weapon.system.computed.modifiers.vt).toContain('BE: -2')
            expect(weapon.system.computed.modifiers.vt).toContain('Zweihändig: -2')
            expect(weapon.system.computed.modifiers.dmg).toContain('Zweihändig: -4')
        })
    })
})
