/**
 * Migration utility for converting old waffeneigenschaften object format to new array format
 */

/**
 * Mapping from old property names to new eigenschaft names
 */
const EIGENSCHAFT_MAPPING = {
    kopflastig: 'Kopflastig',
    niederwerfen: 'Niederwerfen',
    niederwerfen_4: 'Niederwerfen (4)',
    niederwerfen_8: 'Niederwerfen (8)',
    parierwaffe: 'Parierwaffe',
    reittier: 'Reittier',
    ruestungsbrechend: 'Rüstungsbrechend',
    schild: 'Schild',
    schwer_4: 'Schwer (4)',
    schwer_8: 'Schwer (8)',
    stumpf: 'Stumpf',
    unberechenbar: 'Unberechenbar',
    unzerstoerbar: 'Unzerstörbar',
    wendig: 'Wendig',
    zerbrechlich: 'Zerbrechlich',
    zweihaendig: 'Zweihändig',
    kein_malus_nebenwaffe: 'kein Malus als Nebenwaffe',
    kein_reiter: 'kein Reiter',
    umklammern_212: 'Umklammern (-2; 12)',
    umklammern_416: 'Umklammern (-4; 16)',
    umklammern_816: 'Umklammern (-8; 16)',
    stationaer: 'stationär',
    magazin: 'Magazin',
}

/**
 * Check if eigenschaften is in old object format
 * @param {*} eigenschaften - The eigenschaften data to check
 * @returns {boolean} True if old format
 */
export function isOldEigenschaftenFormat(eigenschaften) {
    if (!eigenschaften) return false
    if (Array.isArray(eigenschaften)) return false
    if (typeof eigenschaften === 'object') return true
    return false
}

/**
 * Migrate eigenschaften from old object format to new array format
 * @param {Object} oldEigenschaften - Old eigenschaften object
 * @returns {Array<string>} New eigenschaften array
 */
export function migrateEigenschaften(oldEigenschaften) {
    if (!isOldEigenschaftenFormat(oldEigenschaften)) {
        // Already in new format or empty
        return Array.isArray(oldEigenschaften) ? oldEigenschaften : []
    }

    const newEigenschaften = []

    for (const [key, value] of Object.entries(oldEigenschaften)) {
        // Skip if value is false or falsy
        if (!value) continue

        // Map to new eigenschaft name
        const newName = EIGENSCHAFT_MAPPING[key]
        if (newName) {
            newEigenschaften.push(newName)
        } else {
            console.warn(`Unknown waffeneigenschaft: ${key}`)
        }
    }

    return newEigenschaften
}

/**
 * Migrate a single weapon item
 * @param {Item} weapon - The weapon item to migrate
 * @returns {Promise<boolean>} True if migration was performed
 */
export async function migrateWeapon(weapon) {
    if (!weapon || (weapon.type !== 'nahkampfwaffe' && weapon.type !== 'fernkampfwaffe')) {
        return false
    }

    const eigenschaften = weapon.system.eigenschaften

    if (!isOldEigenschaftenFormat(eigenschaften)) {
        console.log(`Weapon "${weapon.name}" already in new format`)
        return false
    }

    const newEigenschaften = migrateEigenschaften(eigenschaften)

    console.log(`Migrating weapon "${weapon.name}":`, {
        old: eigenschaften,
        new: newEigenschaften,
    })

    await weapon.update({
        'system.eigenschaften': newEigenschaften,
    })

    return true
}

/**
 * Migrate all weapons in a collection
 * @param {Collection} weapons - Collection of weapon items
 * @returns {Promise<Object>} Migration statistics
 */
export async function migrateWeaponCollection(weapons) {
    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const weapon of weapons) {
        try {
            const wasMigrated = await migrateWeapon(weapon)
            if (wasMigrated) {
                migrated++
            } else {
                skipped++
            }
        } catch (error) {
            console.error(`Error migrating weapon "${weapon.name}":`, error)
            errors++
        }
    }

    return { migrated, skipped, errors }
}

/**
 * Migrate all weapons in world items
 * @returns {Promise<Object>} Migration statistics
 */
export async function migrateWorldWeapons() {
    const weapons = game.items.filter(
        (i) => i.type === 'nahkampfwaffe' || i.type === 'fernkampfwaffe',
    )

    ui.notifications.info(`Starting migration of ${weapons.length} weapons in world items...`, {
        permanent: false,
    })

    const stats = await migrateWeaponCollection(weapons)

    ui.notifications.info(
        `Migration complete: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} errors`,
        { permanent: true },
    )

    return stats
}

/**
 * Migrate all weapons owned by all actors
 * @returns {Promise<Object>} Migration statistics
 */
export async function migrateActorWeapons() {
    let totalStats = { migrated: 0, skipped: 0, errors: 0 }

    for (const actor of game.actors) {
        const weapons = actor.items.filter(
            (i) => i.type === 'nahkampfwaffe' || i.type === 'fernkampfwaffe',
        )

        if (weapons.length === 0) continue

        const stats = await migrateWeaponCollection(weapons)
        totalStats.migrated += stats.migrated
        totalStats.skipped += stats.skipped
        totalStats.errors += stats.errors
    }

    ui.notifications.info(
        `Actor weapons migration complete: ${totalStats.migrated} migrated, ${totalStats.skipped} skipped, ${totalStats.errors} errors`,
        { permanent: true },
    )

    return totalStats
}

/**
 * Migrate all weapons in a specific compendium pack
 * @param {string} packName - Name of the compendium pack
 * @returns {Promise<Object>} Migration statistics
 */
export async function migrateCompendiumWeapons(packName) {
    const pack = game.packs.get(packName)

    if (!pack) {
        ui.notifications.error(`Compendium pack "${packName}" not found`)
        return { migrated: 0, skipped: 0, errors: 0 }
    }

    if (pack.metadata.type !== 'Item') {
        ui.notifications.error(`Pack "${packName}" is not an Item pack`)
        return { migrated: 0, skipped: 0, errors: 0 }
    }

    // Load all documents from pack
    const documents = await pack.getDocuments()
    const weapons = documents.filter(
        (i) => i.type === 'nahkampfwaffe' || i.type === 'fernkampfwaffe',
    )

    ui.notifications.info(
        `Starting migration of ${weapons.length} weapons in pack "${packName}"...`,
        { permanent: false },
    )

    const stats = await migrateWeaponCollection(weapons)

    ui.notifications.info(
        `Pack migration complete: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} errors`,
        { permanent: true },
    )

    return stats
}

/**
 * Migrate all weapons everywhere (world, actors, compendiums)
 * @returns {Promise<Object>} Combined migration statistics
 */
export async function migrateAllWeapons() {
    ui.notifications.info('Starting full weapon migration...', { permanent: false })

    let totalStats = { migrated: 0, skipped: 0, errors: 0 }

    // Migrate world items
    const worldStats = await migrateWorldWeapons()
    totalStats.migrated += worldStats.migrated
    totalStats.skipped += worldStats.skipped
    totalStats.errors += worldStats.errors

    // Migrate actor items
    const actorStats = await migrateActorWeapons()
    totalStats.migrated += actorStats.migrated
    totalStats.skipped += actorStats.skipped
    totalStats.errors += actorStats.errors

    // Migrate compendium packs (only unlocked ones)
    for (const pack of game.packs) {
        if (pack.metadata.type !== 'Item') continue
        if (pack.locked) continue

        const packStats = await migrateCompendiumWeapons(pack.collection)
        totalStats.migrated += packStats.migrated
        totalStats.skipped += packStats.skipped
        totalStats.errors += packStats.errors
    }

    ui.notifications.info(
        `Full migration complete! Total: ${totalStats.migrated} migrated, ${totalStats.skipped} skipped, ${totalStats.errors} errors`,
        { permanent: true },
    )

    return totalStats
}

/**
 * Register migration console commands
 */
export function registerMigrationCommands() {
    // Make functions available globally for console use
    window.IlarisMigration = {
        migrateWeapon,
        migrateWorldWeapons,
        migrateActorWeapons,
        migrateCompendiumWeapons,
        migrateAllWeapons,
    }

    console.log(
        'Ilaris Weapon Migration commands registered. Available commands:',
        '\n- IlarisMigration.migrateWorldWeapons()',
        '\n- IlarisMigration.migrateActorWeapons()',
        '\n- IlarisMigration.migrateCompendiumWeapons("packName")',
        '\n- IlarisMigration.migrateAllWeapons()',
    )
}
