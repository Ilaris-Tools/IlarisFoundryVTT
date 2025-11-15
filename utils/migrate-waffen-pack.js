/**
 * Temporary script to migrate all weapons in the waffen compendium pack
 * Run this once from the console: await migrateWaffenPack()
 */

import { migrateCompendiumWeapons } from '../common/waffen-migration.js'

/**
 * Migrate the main waffen compendium pack
 */
export async function migrateWaffenPack() {
    // The pack ID for your waffen compendium
    const packId = 'Ilaris.waffen'

    console.log(`Starting migration of ${packId} compendium...`)

    const stats = await migrateCompendiumWeapons(packId)

    console.log('Migration complete:', stats)

    return stats
}

// Make available globally for console use
window.migrateWaffenPack = migrateWaffenPack
console.log('Waffen pack migration script loaded. Run: await migrateWaffenPack()')
