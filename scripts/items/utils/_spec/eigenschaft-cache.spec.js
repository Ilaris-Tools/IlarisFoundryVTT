// Mock global dependencies
global.game = {
    items: [],
    packs: [],
}

const { EigenschaftCache } = require('../eigenschaft-cache.js')

describe('EigenschaftCache', () => {
    let cache
    let mockEigenschaft1
    let mockEigenschaft2

    beforeEach(() => {
        jest.clearAllMocks()

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
        game.packs = []
    })

    describe('constructor', () => {
        it('should initialize with empty cache', () => {
            expect(cache.size()).toBe(0)
        })

        it('should not be loaded initially', () => {
            expect(cache.isLoaded()).toBe(false)
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
            expect(cache.get('Kopflastig')).toBe(mockEigenschaft1)
        })

        it('should return null if cache is null', () => {
            cache.cache = null
            expect(cache.get('Kopflastig')).toBeNull()
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
        it('should clear cache and reset state', () => {
            cache.cache.set('Kopflastig', mockEigenschaft1)
            cache.loaded = true
            cache.loading = true

            cache.clear()

            expect(cache.size()).toBe(0)
            expect(cache.isLoaded()).toBe(false)
            expect(cache.isLoading()).toBe(false)
        })
    })

    describe('size', () => {
        it('should return number of cached items', () => {
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

            expect(cache.isLoaded()).toBe(true)
            expect(cache.size()).toBe(2)
            expect(cache.get('Kopflastig')).toBe(mockEigenschaft1)
            expect(cache.get('Zweihändig')).toBe(mockEigenschaft2)
        })

        it('should load items from compendium', async () => {
            const mockPack = {
                metadata: { type: 'Item' },
                getDocuments: jest.fn().mockResolvedValue([mockEigenschaft1]),
            }
            game.packs = [mockPack]

            await cache.load(['Kopflastig'])

            expect(cache.isLoaded()).toBe(true)
            expect(cache.get('Kopflastig')).toBe(mockEigenschaft1)
            expect(mockPack.getDocuments).toHaveBeenCalled()
        })

        it('should prefer world items over compendium', async () => {
            const worldItem = { ...mockEigenschaft1, source: 'world' }
            const compendiumItem = { ...mockEigenschaft1, source: 'compendium' }

            game.items = [worldItem]
            const mockPack = {
                metadata: { type: 'Item' },
                getDocuments: jest.fn().mockResolvedValue([compendiumItem]),
            }
            game.packs = [mockPack]

            await cache.load(['Kopflastig'])

            expect(cache.get('Kopflastig')).toBe(worldItem)
            expect(mockPack.getDocuments).not.toHaveBeenCalled()
        })

        it('should cache null for non-existent items', async () => {
            await cache.load(['Nonexistent'])

            expect(cache.isLoaded()).toBe(true)
            expect(cache.has('Nonexistent')).toBe(true)
            expect(cache.get('Nonexistent')).toBeNull()
        })

        it('should not reload if already loading', async () => {
            game.items = [mockEigenschaft1]
            cache.loading = true

            await cache.load(['Kopflastig'])

            // Should not have loaded since already loading
            expect(cache.size()).toBe(0)
        })

        it('should use cached items on subsequent loads', async () => {
            game.items = [mockEigenschaft1]

            // First load
            await cache.load(['Kopflastig'])
            expect(cache.size()).toBe(1)

            // Clear game items to prove it uses cache
            game.items = []

            // Second load - should use cache
            await cache.load(['Kopflastig'])
            expect(cache.get('Kopflastig')).toBe(mockEigenschaft1)
        })

        it('should set loaded to false if loading throws error', async () => {
            const mockPack = {
                metadata: { type: 'Item' },
                getDocuments: jest.fn().mockRejectedValue(new Error('Load error')),
            }
            game.packs = [mockPack]

            try {
                await cache.load(['Kopflastig'])
            } catch (e) {
                // Expected to throw
            }

            expect(cache.isLoading()).toBe(false)
            expect(cache.isLoaded()).toBe(false)
        })

        it('should skip non-Item packs', async () => {
            const actorPack = {
                metadata: { type: 'Actor' },
                getDocuments: jest.fn(),
            }
            game.packs = [actorPack]

            await cache.load(['Kopflastig'])

            expect(actorPack.getDocuments).not.toHaveBeenCalled()
        })
    })

    describe('integration', () => {
        it('should handle multiple sequential loads', async () => {
            game.items = [mockEigenschaft1]

            await cache.load(['Kopflastig'])
            expect(cache.size()).toBe(1)

            game.items = [mockEigenschaft1, mockEigenschaft2]

            // Load new item
            await cache.load(['Zweihändig'])
            expect(cache.size()).toBe(2)
        })

        it('should maintain cache across clear and reload', async () => {
            game.items = [mockEigenschaft1]

            await cache.load(['Kopflastig'])
            expect(cache.size()).toBe(1)

            cache.clear()
            expect(cache.size()).toBe(0)

            await cache.load(['Kopflastig'])
            expect(cache.size()).toBe(1)
            expect(cache.get('Kopflastig')).toBe(mockEigenschaft1)
        })
    })
})
