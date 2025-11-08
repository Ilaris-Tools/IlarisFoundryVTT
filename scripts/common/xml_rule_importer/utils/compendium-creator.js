import { PACK_DEFINITIONS } from '../constants.js'

/**
 * Compendium Creator utility for creating Foundry compendium packs
 */
export class CompendiumCreator {
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
                const packId = `world.${xmlFileName
                    .toLowerCase()
                    .replace(/\s+/g, '-')}-${packDef.key.toLowerCase()}`

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
