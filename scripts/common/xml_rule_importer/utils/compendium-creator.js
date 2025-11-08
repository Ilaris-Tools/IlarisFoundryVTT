import { PACK_DEFINITIONS } from '../constants.js'

/**
 * Compendium Creator utility for creating Foundry compendium packs
 */
export class CompendiumCreator {
    /**
     * Sanitize a string to be valid for Foundry pack IDs
     * Only allows alphanumeric characters, hyphens, and underscores
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string safe for pack IDs
     */
    static sanitizePackId(str) {
        return str
            .toLowerCase()
            .normalize('NFD') // Decompose umlauts and accents
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9\-_]/g, '-') // Replace invalid chars with hyphen
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    }

    /**
     * Create compendium packs from imported data
     * @param {Object} importedData - Object containing arrays of imported items by type
     * @param {string} xmlFileName - Name of the XML file (without extension) for folder/pack naming
     * @returns {Promise<Object>} Results object with createdPacks, errors, and folderName
     */
    static async createCompendiumPacks(importedData, xmlFileName) {
        const results = {
            folderName: xmlFileName,
            createdPacks: [],
            errors: [],
        }

        // First, create a folder for this XML import
        let folder = null
        try {
            folder = await Folder.create({
                name: xmlFileName,
                type: 'Compendium',
                color: '#4169E1', // Royal blue color
            })
        } catch (error) {
            console.error(`❌ Error creating folder ${xmlFileName}:`, error)
            results.errors.push({ type: 'folder', name: xmlFileName, error: error.message })
        }

        // Create compendium packs for each item type
        for (const packDef of PACK_DEFINITIONS) {
            const items = importedData[packDef.key]
            if (!items || items.length === 0) {
                continue
            }

            try {
                // Create pack name as "xmlFileName - Label"
                const packName = `${xmlFileName} - ${packDef.label}`

                // Sanitize the xmlFileName for use in pack ID
                const sanitizedFileName = this.sanitizePackId(xmlFileName)
                const packId = `world-${sanitizedFileName}-${packDef.key}`

                // Create the compendium pack
                const pack = await CompendiumCollection.createCompendium({
                    name: packId,
                    label: packName,
                    type: packDef.type,
                    folder: folder?.id,
                    package: 'world',
                    system: game.system.id,
                })

                // Add items to the pack
                const itemsToCreate = items.map((item) => {
                    // Remove _key and _stats fields that shouldn't be in the creation data
                    const { _key, _stats, _id, ...itemData } = item
                    return itemData
                })

                await Item.createDocuments(itemsToCreate, { pack: pack.collection })

                results.createdPacks.push({
                    key: packDef.key,
                    packId: pack.collection,
                    label: packName,
                    itemCount: itemsToCreate.length,
                })
            } catch (error) {
                console.error(`❌ Error creating pack for ${packDef.label}:`, error)
                results.errors.push({
                    type: 'pack',
                    name: packDef.label,
                    error: error.message,
                })
            }
        }

        return results
    }
}
