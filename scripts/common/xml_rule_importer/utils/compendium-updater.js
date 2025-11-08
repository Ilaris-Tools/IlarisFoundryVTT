import { PACK_DEFINITIONS } from '../constants.js'
import { CompendiumCreator } from './compendium-creator.js'

/**
 * Compendium Updater utility for updating existing Foundry compendium packs
 */
export class CompendiumUpdater {
    /**
     * Properties that should not be updated (Foundry-only, not from XML)
     * These are properties that users can manually modify in Foundry
     * @returns {string[]} Array of property names
     */
    static get FOUNDRY_ONLY_PROPERTIES() {
        return [
            'foundryScript',
            'input',
            'modifications',
            '_id',
            '_stats',
            'folder',
            'sort',
            'ownership',
            'flags',
        ]
    }

    /**
     * Find compendium packs that match the XML filename
     * @param {string} xmlFileName - Name of the XML file (without extension)
     * @returns {Array} Array of matching compendium packs
     */
    static findMatchingPacks(xmlFileName) {
        const sanitizedFileName = CompendiumCreator.sanitizePackId(xmlFileName)
        const matchingPacks = []

        for (const pack of game.packs) {
            // Check if pack name contains the sanitized filename
            if (pack.metadata.name && pack.metadata.name.includes(sanitizedFileName)) {
                matchingPacks.push(pack)
            }
        }

        return matchingPacks
    }

    /**
     * Get the pack key from pack name
     * @param {string} packName - The pack metadata name
     * @param {string} xmlFileName - The XML filename to remove from pack name
     * @returns {string|null} The pack key or null if not found
     */
    static getPackKeyFromName(packName, xmlFileName) {
        const sanitizedFileName = CompendiumCreator.sanitizePackId(xmlFileName)

        for (const packDef of PACK_DEFINITIONS) {
            const sanitizedKey = CompendiumCreator.sanitizePackId(packDef.key)
            const expectedPackId = `${sanitizedFileName}-${sanitizedKey}`

            if (packName.includes(expectedPackId) || packName.endsWith(sanitizedKey)) {
                return packDef.key
            }
        }

        return null
    }

    /**
     * Merge XML data with existing item, preserving Foundry-only properties
     * @param {Object} existingItem - Existing item from compendium
     * @param {Object} xmlItem - New item data from XML
     * @returns {Object} Merged item data
     */
    static mergeItemData(existingItem, xmlItem) {
        const merged = { ...xmlItem }

        // Preserve Foundry-only properties from existing item
        for (const prop of this.FOUNDRY_ONLY_PROPERTIES) {
            if (existingItem[prop] !== undefined) {
                merged[prop] = existingItem[prop]
            }

            // Also check in system data
            if (existingItem.system && existingItem.system[prop] !== undefined) {
                if (!merged.system) merged.system = {}
                merged.system[prop] = existingItem.system[prop]
            }
        }

        // Preserve the _id for updating
        merged._id = existingItem._id

        return merged
    }

    /**
     * Update existing compendiums with new XML data
     * @param {Object} importedData - Object containing arrays of imported items by type
     * @param {string} xmlFileName - Name of the XML file (without extension)
     * @returns {Promise<Object>} Results object with updated, created, and deleted items
     */
    static async updateCompendiumPacks(importedData, xmlFileName) {
        const results = {
            updated: [],
            created: [],
            deleted: [],
            errors: [],
        }

        // Find all matching compendium packs
        const matchingPacks = this.findMatchingPacks(xmlFileName)

        if (matchingPacks.length === 0) {
            // No matching packs found, treat as new import
            ui.notifications.warn(
                `Keine Kompendien für "${xmlFileName}" gefunden. Erstelle neue Kompendien...`,
            )
            const packResults = await CompendiumCreator.createCompendiumPacks(
                importedData,
                xmlFileName,
            )
            return {
                updated: [],
                created: packResults.createdPacks,
                deleted: [],
                errors: packResults.errors,
            }
        }

        // Process each matching pack
        for (const pack of matchingPacks) {
            try {
                const packKey = this.getPackKeyFromName(pack.metadata.name, xmlFileName)

                if (!packKey || !importedData[packKey]) {
                    continue
                }

                const xmlItems = importedData[packKey]

                // Load all existing items from the pack
                await pack.getDocuments()
                const existingItems = pack.index.contents

                // Create a map of existing items by name
                const existingItemsMap = new Map()
                for (const item of existingItems) {
                    existingItemsMap.set(item.name, item)
                }

                // Create a map of XML items by name
                const xmlItemsMap = new Map()
                for (const item of xmlItems) {
                    xmlItemsMap.set(item.name, item)
                }

                // Update or create items
                for (const [name, xmlItem] of xmlItemsMap) {
                    try {
                        const existingItem = existingItemsMap.get(name)

                        if (existingItem) {
                            // Update existing item
                            const fullExistingItem = await pack.getDocument(existingItem._id)
                            const mergedData = this.mergeItemData(fullExistingItem, xmlItem)

                            await fullExistingItem.update(mergedData)

                            results.updated.push({
                                name: name,
                                pack: pack.metadata.label,
                                type: packKey,
                            })
                        } else {
                            // Create new item
                            const { _id, _key, _stats, ...itemData } = xmlItem
                            await Item.create(itemData, { pack: pack.collection })

                            results.created.push({
                                name: name,
                                pack: pack.metadata.label,
                                type: packKey,
                            })
                        }
                    } catch (error) {
                        console.error(`Error processing item "${name}":`, error)
                        results.errors.push({
                            type: 'item',
                            name: name,
                            error: error.message,
                        })
                    }
                }

                // Delete items that are no longer in XML
                for (const [name, existingItem] of existingItemsMap) {
                    if (!xmlItemsMap.has(name)) {
                        try {
                            const fullItem = await pack.getDocument(existingItem._id)
                            await fullItem.delete()

                            results.deleted.push({
                                name: name,
                                pack: pack.metadata.label,
                                type: packKey,
                            })
                        } catch (error) {
                            console.error(`Error deleting item "${name}":`, error)
                            results.errors.push({
                                type: 'delete',
                                name: name,
                                error: error.message,
                            })
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing pack ${pack.metadata.label}:`, error)
                results.errors.push({
                    type: 'pack',
                    name: pack.metadata.label,
                    error: error.message,
                })
            }
        }

        return results
    }
}
