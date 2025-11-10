/**
 * Cache manager for waffeneigenschaft items
 * Handles loading and caching of eigenschaft items from world and compendiums
 */
export class EigenschaftCache {
    constructor() {
        this.cache = new Map()
        this.loaded = false
        this.loading = false
    }

    /**
     * Check if eigenschaften are fully loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded
    }

    /**
     * Check if eigenschaften are currently being loaded
     * @returns {boolean}
     */
    isLoading() {
        return this.loading
    }

    /**
     * Load all eigenschaft items for the given names
     * @param {string[]} eigenschaftNames - Names of eigenschaften to load
     * @returns {Promise<void>}
     */
    async load(eigenschaftNames) {
        if (this.loading) return

        this.loading = true

        try {
            for (const name of eigenschaftNames) {
                await this._loadEigenschaftItem(name)
            }
            this.loaded = true
        } finally {
            this.loading = false
        }
    }

    /**
     * Get an eigenschaft item from cache (synchronous)
     * @param {string} name - Name of the eigenschaft
     * @returns {Item|null} The eigenschaft item or null if not found
     */
    get(name) {
        if (!this.cache) {
            return null
        }
        return this.cache.get(name) || null
    }

    /**
     * Check if an eigenschaft is in the cache
     * @param {string} name - Name of the eigenschaft
     * @returns {boolean}
     */
    has(name) {
        return this.cache.has(name)
    }

    /**
     * Clear the cache and reset loaded state
     */
    clear() {
        this.cache.clear()
        this.loaded = false
        this.loading = false
    }

    /**
     * Get the number of cached items
     * @returns {number}
     */
    size() {
        return this.cache.size
    }

    /**
     * Load a single eigenschaft item from world or compendiums
     * @param {string} name - Name of the eigenschaft
     * @returns {Promise<Item|null>} The eigenschaft item or null
     * @private
     */
    async _loadEigenschaftItem(name) {
        // Check cache first
        if (this.cache.has(name)) {
            return this.cache.get(name)
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
        this.cache.set(name, item)
        return item
    }
}
