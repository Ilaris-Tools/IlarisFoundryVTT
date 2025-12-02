/**
 * Global shared cache for waffeneigenschaft items
 * Uses a singleton pattern to ensure all weapons share the same cache
 */
const globalCache = new Map()
let globalLoaded = false
let globalLoading = false
let hooksRegistered = false

/**
 * Register hooks to listen for waffeneigenschaft item changes
 * Called automatically on first EigenschaftCache instantiation
 */
function registerGlobalHooks() {
    if (hooksRegistered) return

    // Listen for world item updates
    Hooks.on('updateItem', (item, changes, options, userId) => {
        onItemChange(item, 'update')
    })

    // Listen for world item creation
    Hooks.on('createItem', (item, options, userId) => {
        onItemChange(item, 'create')
    })

    // Listen for world item deletion
    Hooks.on('deleteItem', (item, options, userId) => {
        onItemChange(item, 'delete')
    })

    hooksRegistered = true
    console.log('Ilaris | EigenschaftCache global hooks registered')
}

/**
 * Handle item change events
 * @param {Item} item - The changed item
 * @param {string} action - The action type (create, update, delete)
 */
function onItemChange(item, action) {
    if (item.type !== 'waffeneigenschaft') return

    const name = item.name

    if (action === 'delete') {
        // Remove from cache
        if (globalCache.has(name)) {
            globalCache.delete(name)
            console.log(`Ilaris | EigenschaftCache: Removed "${name}" from cache (deleted)`)
            // Trigger refresh for all actors with weapons using this eigenschaft
            refreshActorsWithEigenschaft(name)
        }
    } else {
        // Update or create: refresh the cached item
        globalCache.set(name, item)
        console.log(`Ilaris | EigenschaftCache: Updated "${name}" in cache (${action})`)
        // Trigger refresh for all actors with weapons using this eigenschaft
        refreshActorsWithEigenschaft(name)
    }
}

/**
 * Refresh all actors that have weapons using a specific eigenschaft
 * @param {string} eigenschaftName - Name of the changed eigenschaft
 */
function refreshActorsWithEigenschaft(eigenschaftName) {
    for (const actor of game.actors) {
        const hasEigenschaft = actor.items.some(
            (item) =>
                (item.type === 'nahkampfwaffe' || item.type === 'fernkampfwaffe') &&
                Array.isArray(item.system.eigenschaften) &&
                item.system.eigenschaften.includes(eigenschaftName),
        )
        if (hasEigenschaft) {
            console.log(`Ilaris | Refreshing actor "${actor.name}" due to eigenschaft change`)
            actor.prepareData()
            // Also update any open sheets
            if (actor.sheet?.rendered) {
                actor.sheet.render(false)
            }
        }
    }
}

/**
 * Cache manager for waffeneigenschaft items
 * Handles loading and caching of eigenschaft items from world and compendiums
 * Uses a shared global cache across all instances
 */
export class EigenschaftCache {
    constructor() {
        // Register hooks on first instantiation
        registerGlobalHooks()
        // Track which eigenschaften this instance needs
        this._requiredNames = []
        this._loading = false
    }

    /**
     * Check if all required eigenschaften for this instance are loaded
     * @param {string[]} [eigenschaftNames] - Optional names to check, defaults to _requiredNames
     * @returns {boolean}
     */
    isLoaded(eigenschaftNames) {
        const namesToCheck = eigenschaftNames || this._requiredNames
        // If no eigenschaften are required, consider it loaded
        if (!namesToCheck || namesToCheck.length === 0) return true
        return namesToCheck.every((name) => globalCache.has(name))
    }

    /**
     * Check if eigenschaften are currently being loaded
     * @returns {boolean}
     */
    isLoading() {
        return this._loading || globalLoading
    }

    /**
     * Load all eigenschaft items for the given names
     * @param {string[]} eigenschaftNames - Names of eigenschaften to load
     * @returns {Promise<void>}
     */
    async load(eigenschaftNames) {
        if (this._loading) return

        this._requiredNames = eigenschaftNames || []

        // Check if all are already cached
        if (this.isLoaded()) return

        this._loading = true
        globalLoading = true

        try {
            for (const name of eigenschaftNames) {
                if (!globalCache.has(name)) {
                    await this._loadEigenschaftItem(name)
                }
            }
        } finally {
            this._loading = false
            globalLoading = false
        }
    }

    /**
     * Get an eigenschaft item from cache (synchronous)
     * @param {string} name - Name of the eigenschaft
     * @returns {Item|null} The eigenschaft item or null if not found
     */
    get(name) {
        return globalCache.get(name) || null
    }

    /**
     * Check if an eigenschaft is in the cache
     * @param {string} name - Name of the eigenschaft
     * @returns {boolean}
     */
    has(name) {
        return globalCache.has(name)
    }

    /**
     * Clear instance state (does not clear global cache)
     */
    clear() {
        this._requiredNames = []
        this._loading = false
    }

    /**
     * Get the number of cached items
     * @returns {number}
     */
    size() {
        return globalCache.size
    }

    /**
     * Get access to the underlying cache Map (for testing)
     * @returns {Map}
     */
    get cache() {
        return globalCache
    }

    /**
     * Set the loaded state (for testing)
     * Sets _requiredNames to current cache keys to simulate loaded state
     * @param {boolean} value
     */
    set loaded(value) {
        if (value) {
            // Set _requiredNames to match what's in cache so isLoaded() returns true
            this._requiredNames = Array.from(globalCache.keys())
        } else {
            this._requiredNames = []
        }
    }

    /**
     * Load a single eigenschaft item from world or compendiums
     * @param {string} name - Name of the eigenschaft
     * @returns {Promise<Item|null>} The eigenschaft item or null
     * @private
     */
    async _loadEigenschaftItem(name) {
        // Check cache first
        if (globalCache.has(name)) {
            return globalCache.get(name)
        }

        // Search world items
        let item = game.items.find((i) => i.type === 'waffeneigenschaft' && i.name === name)

        // Search compendiums if not found
        if (!item) {
            for (const pack of game.packs) {
                if (pack.metadata.type === 'Item') {
                    const items = await pack.getDocuments()
                    item = items.find((i) => i.type === 'waffeneigenschaft' && i.name === name)
                    if (item) break
                }
            }
        }

        // Cache the result (even if null to avoid repeated searches)
        globalCache.set(name, item)
        return item
    }
}

/**
 * Reset the global cache state (for testing purposes)
 */
export function resetGlobalCache() {
    globalCache.clear()
    globalLoaded = false
    globalLoading = false
}

/**
 * Preload all waffeneigenschaft items from world and compendiums
 * Call this during system initialization to populate the cache
 * @returns {Promise<number>} Number of eigenschaften loaded
 */
export async function preloadAllEigenschaften() {
    if (globalLoading) {
        console.log('Ilaris | EigenschaftCache: Already loading eigenschaften')
        return globalCache.size
    }

    globalLoading = true
    console.log('Ilaris | EigenschaftCache: Preloading all waffeneigenschaften...')

    try {
        // Load from world items
        const worldEigenschaften = game.items.filter((i) => i.type === 'waffeneigenschaft')
        for (const item of worldEigenschaften) {
            globalCache.set(item.name, item)
        }

        // Load from compendiums
        for (const pack of game.packs) {
            if (pack.metadata.type === 'Item') {
                const items = await pack.getDocuments()
                const eigenschaften = items.filter((i) => i.type === 'waffeneigenschaft')
                for (const item of eigenschaften) {
                    if (!globalCache.has(item.name)) {
                        globalCache.set(item.name, item)
                    }
                }
            }
        }

        globalLoaded = true
        console.log(`Ilaris | EigenschaftCache: Preloaded ${globalCache.size} waffeneigenschaften`)
        return globalCache.size
    } finally {
        globalLoading = false
    }
}
