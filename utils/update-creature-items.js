import fs from 'fs'
import path from 'path'

// Paths to the compendium packs
const CREATURE_SOURCE_PATH = './packs/kreaturen/_source'
const LITURGIEN_SOURCE_PATH = './packs/liturgien-und-mirakel/_source'
const VORTEILE_SOURCE_PATH = './packs/vorteile/_source'
const ZAUBERSPRUCHE_SOURCE_PATH = './packs/zauberspruche-und-rituale/_source'

console.log('🔄 Starting creature item update process...')

/**
 * Load all JSON files from a directory into a Map keyed by name
 */
function loadCompendiumItems(dirPath, itemType) {
    const items = new Map()

    if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  Directory not found: ${dirPath}`)
        return items
    }

    const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.json'))
    console.log(`📁 Loading ${files.length} ${itemType} files from ${dirPath}`)

    for (const file of files) {
        try {
            const filePath = path.join(dirPath, file)
            const content = fs.readFileSync(filePath, 'utf8')
            const item = JSON.parse(content)

            if (item.name) {
                items.set(item.name, item)
            } else {
                console.warn(`⚠️  Item in ${file} has no name`)
            }
        } catch (error) {
            console.error(`❌ Error loading ${file}: ${error.message}`)
        }
    }

    console.log(`✅ Loaded ${items.size} ${itemType} items`)
    return items
}

/**
 * Update creature items with system data from compendium
 */
function updateCreatureItems(creature, compendiumItems) {
    if (!creature.items || !Array.isArray(creature.items)) {
        return { updated: false, count: 0 }
    }

    let updateCount = 0

    for (let i = 0; i < creature.items.length; i++) {
        const item = creature.items[i]

        if (item.name && compendiumItems.has(item.name)) {
            const compendiumItem = compendiumItems.get(item.name)

            // Only update the system object from the compendium item
            if (compendiumItem.system) {
                creature.items[i].system = JSON.parse(JSON.stringify(compendiumItem.system))
                updateCount++
                console.log(`    - Updated system data: ${item.name}`)
            }
        }
    }

    return { updated: updateCount > 0, count: updateCount }
}

/**
 * Process all creature files
 */
function processCreatureFiles() {
    // Load compendium items
    console.log('\n📚 Loading compendium data...')
    const liturgienItems = loadCompendiumItems(LITURGIEN_SOURCE_PATH, 'liturgien-und-mirakel')
    const vorteileItems = loadCompendiumItems(VORTEILE_SOURCE_PATH, 'vorteile')
    const zauberItems = loadCompendiumItems(ZAUBERSPRUCHE_SOURCE_PATH, 'zauberspruche-und-rituale')

    // Combine all compendium items
    const allCompendiumItems = new Map([...liturgienItems, ...vorteileItems, ...zauberItems])

    console.log(`📊 Total compendium items available: ${allCompendiumItems.size}`)

    // Process creature files
    console.log('\n🦴 Processing creature files...')
    if (!fs.existsSync(CREATURE_SOURCE_PATH)) {
        console.error(`❌ Creature source directory not found: ${CREATURE_SOURCE_PATH}`)
        return
    }

    const creatureFiles = fs
        .readdirSync(CREATURE_SOURCE_PATH)
        .filter((file) => file.endsWith('.json'))
    console.log(`📁 Found ${creatureFiles.length} creature files`)

    let processedCount = 0
    let updatedCount = 0
    let totalItemsUpdated = 0

    for (const file of creatureFiles) {
        try {
            const filePath = path.join(CREATURE_SOURCE_PATH, file)
            const content = fs.readFileSync(filePath, 'utf8')
            const creature = JSON.parse(content)

            const result = updateCreatureItems(creature, allCompendiumItems)

            if (result.updated) {
                // Write the updated creature back to file
                fs.writeFileSync(filePath, JSON.stringify(creature, null, 2))
                updatedCount++
                totalItemsUpdated += result.count
                console.log(`✅ Updated ${creature.name || file}: ${result.count} items updated`)
            }

            processedCount++
        } catch (error) {
            console.error(`❌ Error processing ${file}: ${error.message}`)
        }
    }

    console.log('\n📈 Summary:')
    console.log(`📁 Total creatures processed: ${processedCount}`)
    console.log(`🔄 Creatures updated: ${updatedCount}`)
    console.log(`📝 Total items updated: ${totalItemsUpdated}`)
}

// Run the script
try {
    processCreatureFiles()
    console.log('\n🎉 Update process completed successfully!')
} catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
}
