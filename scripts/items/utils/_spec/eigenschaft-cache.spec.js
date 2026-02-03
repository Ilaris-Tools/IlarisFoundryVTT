// Setup mocks before any imports
const Hooks = {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
}
global.Hooks = Hooks
globalThis.Hooks = Hooks

global.game = {
    items: [],
    packs: new Map(),
    actors: [],
    settings: {
        get: jest.fn((namespace, key) => {
            if (namespace === 'Ilaris' && key === 'waffeneigenschaftenPacks') {
                return JSON.stringify(['Ilaris.waffeneigenschaften'])
            }
            return undefined
        }),
    },
}

const { EigenschaftCache, resetGlobalCache } = require('../eigenschaft-cache.js')

describe('EigenschaftCache', () => {
    let cache
    let mockEigenschaft1
    let mockEigenschaft2
    let consoleLogSpy
    let consoleWarnSpy

    beforeEach(() => {
        jest.clearAllMocks()

        // Suppress console output during tests
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        // Reset the global cache before each test
        resetGlobalCache()

        cache = new EigenschaftCache()

        mockEigenschaft1 = {
            name: 'Kopflastig',
            type: 'waffeneigenschaft',
            system: { kategorie: 'modifier' },
        }

        mockEigenschaft2 = {
            name: 'Zweihändig',
            type: 'waffeneigenschaft',
            system: { kategorie: 'wielding' },
        }

        // Reset game items and packs
        game.items = []
        game.packs.clear()
        game.actors = []
    })

    afterEach(() => {
        consoleLogSpy.mockRestore()
        consoleWarnSpy.mockRestore()
    })

    describe('constructor', () => {
        it('should initialize with empty global cache', () => {
            expect(cache.size()).toBe(0)
        })

        it('should be considered loaded when no eigenschaften required', () => {
            expect(cache.isLoaded()).toBe(true) // No required names = loaded
        })

        it('should not be considered loaded when eigenschaften are required but not cached', () => {
            expect(cache.isLoaded(['Nonexistent'])).toBe(false)
        })

        it('should not be loading initially', () => {
            expect(cache.isLoading()).toBe(false)
        })
    })

    describe('get', () => {
        it('should return null for non-existent item', () => {
            expect(cache.get('Nonexistent')).toBeNull()
        })

        it('should return cached item', () => {
            cache.cache.set('Kopflastig', mockEigenschaft1)
            expect(cache.get('Kopflastig')).toEqual(mockEigenschaft1)
        })
    })

    describe('has', () => {
        it('should return false for non-existent item', () => {
            expect(cache.has('Nonexistent')).toBe(false)
        })

        it('should return true for cached item', () => {
            cache.cache.set('Kopflastig', mockEigenschaft1)
            expect(cache.has('Kopflastig')).toBe(true)
        })
    })

    describe('clear', () => {
        it('should clear instance state but not global cache', () => {
            cache.cache.set('Kopflastig', mockEigenschaft1)
            cache._requiredNames = ['Kopflastig']
            cache._loading = true

            const sizeBefore = cache.size()
            cache.clear()

            expect(cache.size()).toBe(sizeBefore) // Global cache unchanged
            expect(cache._requiredNames).toEqual([])
            expect(cache.isLoading()).toBe(false)
        })
    })

    describe('size', () => {
        it('should return number of cached items in global cache', () => {
            // Start from current size (may have items from test pollution)
            resetGlobalCache()
            expect(cache.size()).toBe(0)

            cache.cache.set('Kopflastig', mockEigenschaft1)
            expect(cache.size()).toBe(1)

            cache.cache.set('Zweihändig', mockEigenschaft2)
            expect(cache.size()).toBe(2)
        })
    })

    describe('load', () => {
        it('should load items from world', async () => {
            game.items = [mockEigenschaft1, mockEigenschaft2]

            await cache.load(['Kopflastig', 'Zweihändig'])

            expect(cache.isLoaded(['Kopflastig', 'Zweihändig'])).toBe(true)
            expect(cache.get('Kopflastig')).toEqual(mockEigenschaft1)
            expect(cache.get('Zweihändig')).toEqual(mockEigenschaft2)
        })

        it('should load items from compendium', async () => {
            const mockPack = {
                metadata: { type: 'Item' },
                getDocuments: jest.fn().mockResolvedValue([mockEigenschaft1]),
            }
            game.packs.set('Ilaris.waffeneigenschaften', mockPack)

            await cache.load(['Kopflastig'])

            expect(cache.isLoaded(['Kopflastig'])).toBe(true)
            expect(cache.get('Kopflastig')).toEqual(mockEigenschaft1)
            expect(mockPack.getDocuments).toHaveBeenCalled()
        })

        it('should prefer world items over compendium', async () => {
            const worldItem = {
                name: 'Kopflastig',
                type: 'waffeneigenschaft',
                system: { kategorie: 'modifier' },
                source: 'world',
            }
            const compendiumItem = {
                name: 'Kopflastig',
                type: 'waffeneigenschaft',
                system: { kategorie: 'modifier' },
                source: 'compendium',
            }

            game.items = [worldItem]
            const mockPack = {
                metadata: { type: 'Item' },
                getDocuments: jest.fn().mockResolvedValue([compendiumItem]),
            }
            game.packs.set('Ilaris.waffeneigenschaften', mockPack)

            await cache.load(['Kopflastig'])

            const cached = cache.get('Kopflastig')
            expect(cached.name).toBe('Kopflastig')
            expect(mockPack.getDocuments).not.toHaveBeenCalled()
        })

        it('should cache null for non-existent items', async () => {
            await cache.load(['Nonexistent'])

            expect(cache.isLoaded(['Nonexistent'])).toBe(true)
            expect(cache.has('Nonexistent')).toBe(true)
            expect(cache.get('Nonexistent')).toBeNull()
        })

        it('should not reload if already loading', async () => {
            resetGlobalCache() // Clean slate
            game.items = [mockEigenschaft1]
            cache._loading = true

            await cache.load(['Kopflastig'])

            // Should not have loaded since already loading
            expect(cache.size()).toBe(0)
        })

        it('should use cached items on subsequent loads', async () => {
            resetGlobalCache() // Clean slate
            game.items = [mockEigenschaft1]

            // First load
            await cache.load(['Kopflastig'])
            expect(cache.size()).toBe(1)

            // Clear game items to prove it uses cache
            game.items = []

            // Second load - should use cache
            await cache.load(['Kopflastig'])
            expect(cache.get('Kopflastig')).toEqual(mockEigenschaft1)
            expect(cache.size()).toBe(1) // Size unchanged
        })

        it('should skip items already in global cache', async () => {
            // Pre-populate cache
            cache.cache.set('Kopflastig', mockEigenschaft1)

            const mockPack = {
                metadata: { type: 'Item' },
                getDocuments: jest.fn(),
            }
            game.packs.set('Ilaris.waffeneigenschaften', mockPack)

            await cache.load(['Kopflastig'])

            // Should not search since already cached
            expect(mockPack.getDocuments).not.toHaveBeenCalled()
        })

        it('should skip non-Item packs', async () => {
            const actorPack = {
                metadata: { type: 'Actor' },
                getDocuments: jest.fn(),
            }
            game.packs.set('Ilaris.actors', actorPack)

            await cache.load(['Kopflastig'])

            expect(actorPack.getDocuments).not.toHaveBeenCalled()
        })

        it('should return early if all required items already loaded', async () => {
            cache.cache.set('Kopflastig', mockEigenschaft1)
            const spy = jest.spyOn(cache, '_loadEigenschaftItem')

            await cache.load(['Kopflastig'])

            expect(spy).not.toHaveBeenCalled()
        })

        it('should set _loading to false after completion', async () => {
            game.items = [mockEigenschaft1]

            await cache.load(['Kopflastig'])

            expect(cache.isLoading()).toBe(false)
        })
    })

    describe('integration', () => {
        it('should handle multiple sequential loads', async () => {
            resetGlobalCache() // Clean slate
            game.items = [mockEigenschaft1]

            await cache.load(['Kopflastig'])
            expect(cache.size()).toBe(1)

            game.items = [mockEigenschaft1, mockEigenschaft2]

            // Load new item
            await cache.load(['Zweihändig'])
            expect(cache.size()).toBe(2)
        })

        it('should share global cache across instances', async () => {
            resetGlobalCache() // Clean slate
            const cache2 = new EigenschaftCache()

            game.items = [mockEigenschaft1]
            await cache.load(['Kopflastig'])

            // cache2 should see the same global cache
            expect(cache2.get('Kopflastig')).toEqual(mockEigenschaft1)
            expect(cache2.size()).toBe(cache.size())
        })

        it('should maintain instance-specific _requiredNames', async () => {
            resetGlobalCache() // Clean slate
            const cache2 = new EigenschaftCache()

            game.items = [mockEigenschaft1, mockEigenschaft2]

            await cache.load(['Kopflastig'])
            await cache2.load(['Zweihändig'])

            expect(cache._requiredNames).toEqual(['Kopflastig'])
            expect(cache2._requiredNames).toEqual(['Zweihändig'])
            // Global cache has both
            expect(cache.has('Kopflastig')).toBe(true)
            expect(cache.has('Zweihändig')).toBe(true)
        })
    })
})
