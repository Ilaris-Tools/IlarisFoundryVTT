/**
 * Migration to convert weapon eigenschaften to parametrized object format
 * Migration version: 12.3.0 (updated for parameters)
 */

import { parseEigenschaftString } from '../properties/utils/eigenschaft-parser.js'
const isNewerVersion = foundry.utils.isNewerVersion
/**
 * Mapping from old property names and string formats to new parametrized format
 */
const EIGENSCHAFT_MIGRATION_MAP = {
    // Old object format keys
    kopflastig: { key: 'Unberechenbar', parameters: [] },
    niederwerfen: { key: 'Niederwerfen', parameters: [] },
    niederwerfen_4: { key: 'Niederwerfen', parameters: [4] },
    niederwerfen_8: { key: 'Niederwerfen', parameters: [8] },
    parierwaffe: { key: 'Parierwaffe', parameters: [] },
    reittier: { key: 'Reittier', parameters: [] },
    ruestungsbrechend: { key: 'Rüstungsbrechend', parameters: [] },
    schild: { key: 'Schild', parameters: [] },
    schwer_4: { key: 'Schwer', parameters: [4] },
    schwer_8: { key: 'Schwer', parameters: [8] },
    stationaer: { key: 'stationär', parameters: [] },
    stumpf: { key: 'Stumpf', parameters: [] },
    unberechenbar: { key: 'Unberechenbar', parameters: [] },
    unzerstoerbar: { key: 'Unzerstörbar', parameters: [] },
    wendig: { key: 'Wendig', parameters: [] },
    zerbrechlich: { key: 'Zerbrechlich', parameters: [] },
    zweihaendig: { key: 'Zweihändig', parameters: [] },
    umklammern: { key: 'Umklammern', parameters: [] },
    umklammern_2_12: { key: 'Umklammern', parameters: [-2, 12] },
    umklammern_4_16: { key: 'Umklammern', parameters: [-4, 16] },
    umklammern_8_16: { key: 'Umklammern', parameters: [-8, 16] },
    umklammern_212: { key: 'Umklammern', parameters: [-2, 12] },

    // Old string formats with parameters
    'Schwer (4)': { key: 'Schwer', parameters: [4] },
    'Schwer (+4)': { key: 'Schwer', parameters: [4] },
    'Schwer (8)': { key: 'Schwer', parameters: [8] },
    'Schwer (+8)': { key: 'Schwer', parameters: [8] },
    'Niederwerfen (+4)': { key: 'Niederwerfen', parameters: [4] },
    'Niederwerfen (+8)': { key: 'Niederwerfen', parameters: [8] },
    'Umklammern (-2; 12)': { key: 'Umklammern', parameters: [-2, 12] },
    'Umklammern (-4; 16)': { key: 'Umklammern', parameters: [-4, 16] },
    'Umklammern (-8; 16)': { key: 'Umklammern', parameters: [-8, 16] },
    'Umklammern (±2/12)': { key: 'Umklammern', parameters: [-2, 12] },
    'Umklammern (±4/16)': { key: 'Umklammern', parameters: [-4, 16] },
    'Umklammern (±8/16)': { key: 'Umklammern', parameters: [-8, 16] },

    // Common eigenschaften without parameters
    Zweihändig: { key: 'Zweihändig', parameters: [] },
    Parierwaffe: { key: 'Parierwaffe', parameters: [] },
    Unberechenbar: { key: 'Unberechenbar', parameters: [] },
    Wendig: { key: 'Wendig', parameters: [] },
    Rüstungsbrechend: { key: 'Rüstungsbrechend', parameters: [] },
    Stumpf: { key: 'Stumpf', parameters: [] },

    // Deprecated properties that should be removed
    kein_malus_nebenwaffe: null,
    kein_reiter: null,
}

/**
 * Check if a weapon needs migration
 * @param {Item} weapon - The weapon item
 * @returns {boolean}
 */
function needsMigration(weapon) {
    if (weapon.type !== 'nahkampfwaffe' && weapon.type !== 'fernkampfwaffe') {
        return false
    }

    const eigenschaften = weapon.system.eigenschaften

    // Need migration if object format (very old)
    if (eigenschaften && typeof eigenschaften === 'object' && !Array.isArray(eigenschaften)) {
        return true
    }

    // Need migration if string array (old)
    if (Array.isArray(eigenschaften) && eigenschaften.length > 0) {
        // Check if any element is a string (old format)
        return eigenschaften.some((eig) => typeof eig === 'string')
    }

    return false
}

/**
 * Migrate a single weapon's eigenschaften to parametrized object format
 * Supports three input formats:
 * 1. Object format (very old): {schwer_4: true, zweihaendig: true}
 * 2. String array (old): ["Schwer (4)", "Zweihändig"]
 * 3. Object array (current): [{key: "Schwer", parameters: [4]}, {key: "Zweihändig", parameters: []}]
 *
 * @param {Item} weapon - The weapon item to migrate
 * @returns {Array<{key, parameters}>|null} - Array of eigenschaft objects or null if no migration needed
 */
function migrateWeaponEigenschaften(weapon) {
    if (!needsMigration(weapon)) {
        return null
    }

    const eigenschaften = []
    const source = weapon.system.eigenschaften

    // Handle old object format
    if (source && typeof source === 'object' && !Array.isArray(source)) {
        for (const [key, value] of Object.entries(source)) {
            if (value === true) {
                const mapped = EIGENSCHAFT_MIGRATION_MAP[key]
                if (mapped) {
                    eigenschaften.push(mapped)
                } else if (!EIGENSCHAFT_MIGRATION_MAP.hasOwnProperty(key)) {
                    console.warn(
                        `Ilaris | Unknown eigenschaft property during migration: ${key} on weapon ${weapon.name}`,
                    )
                }
            }
        }
        return eigenschaften
    }

    // Handle string array format
    if (Array.isArray(source)) {
        for (const eig of source) {
            // Already migrated (object format)
            if (eig && typeof eig === 'object' && eig.key) {
                eigenschaften.push(eig)
                continue
            }

            // String format - try mapping first
            if (typeof eig === 'string') {
                const mapped = EIGENSCHAFT_MIGRATION_MAP[eig]
                if (mapped) {
                    eigenschaften.push(mapped)
                } else {
                    // Not in map - parse it
                    const parsed = parseEigenschaftString(eig)
                    if (parsed) {
                        eigenschaften.push(parsed)
                    } else {
                        console.warn(
                            `Ilaris | Could not parse eigenschaft "${eig}" on weapon ${weapon.name}`,
                        )
                    }
                }
            }
        }
        return eigenschaften
    }

    return null
}

/**
 * Migrate all weapons in an actor
 * @param {Actor} actor - The actor to migrate
 * @returns {Promise<number>} - Number of weapons migrated
 */
export async function migrateActorWeapons(actor) {
    let migratedCount = 0
    const updates = []

    for (const item of actor.items) {
        if (item.type !== 'nahkampfwaffe' && item.type !== 'fernkampfwaffe') {
            continue
        }

        const newEigenschaften = migrateWeaponEigenschaften(item)
        if (newEigenschaften !== null) {
            updates.push({
                _id: item.id,
                'system.eigenschaften': newEigenschaften,
            })
            migratedCount++
        }
    }

    if (updates.length > 0) {
        await actor.updateEmbeddedDocuments('Item', updates)
        console.log(`Ilaris | Migrated ${migratedCount} weapons on actor: ${actor.name}`)
    }

    return migratedCount
}

/**
 * Migrate all held actors in the world
 * @returns {Promise<{actors: number, weapons: number}>}
 */
export async function migrateAllHeldActors() {
    console.log('Ilaris | Starting weapon eigenschaften migration to parametrized format...')

    let actorCount = 0
    let weaponCount = 0

    const heldActors = game.actors.filter((actor) => actor.type === 'held')

    for (const actor of heldActors) {
        const migrated = await migrateActorWeapons(actor)
        if (migrated > 0) {
            actorCount++
            weaponCount += migrated
        }
    }

    if (actorCount > 0) {
        ui.notifications.info(
            `Ilaris: Migrated ${weaponCount} weapons on ${actorCount} held actors to parametrized eigenschaften format.`,
        )
    }

    console.log(`Ilaris | Migration complete: ${weaponCount} weapons on ${actorCount} actors`)

    return { actors: actorCount, weapons: weaponCount }
}

/**
 * Migrate weapons in a specific compendium
 * @param {string} packName - Name of the compendium pack
 * @returns {Promise<number>} - Number of weapons migrated
 */
export async function migrateCompendiumWeapons(packName) {
    const pack = game.packs.get(packName)
    if (!pack) {
        console.warn(`Ilaris | Compendium "${packName}" not found`)
        return 0
    }

    console.log(`Ilaris | Migrating weapons in compendium: ${packName}`)

    const documents = await pack.getDocuments()
    const weapons = documents.filter(
        (doc) => doc.type === 'nahkampfwaffe' || doc.type === 'fernkampfwaffe',
    )

    let migratedCount = 0
    for (const weapon of weapons) {
        const newEigenschaften = migrateWeaponEigenschaften(weapon)
        if (newEigenschaften !== null) {
            await weapon.update({ 'system.eigenschaften': newEigenschaften })
            migratedCount++
        }
    }

    if (migratedCount > 0) {
        console.log(`Ilaris | Migrated ${migratedCount} weapons in compendium: ${packName}`)
    }

    return migratedCount
}

/**
 * Check if migration should run
 * Migration runs once per world when:
 * - User is GM
 * - World schema version is less than 12.3.0
 *
 * @returns {boolean}
 */
export function shouldRunMigration() {
    if (!game.user.isGM) {
        return false
    }

    const worldSchemaVersion = game.settings.get('Ilaris', 'worldSchemaVersion') || '0.0.0'

    // Check if world schema version is less than 12.3.0
    return isNewerVersion('12.3.0', worldSchemaVersion)
}

/**
 * Run the migration if needed
 */
export async function runMigrationIfNeeded() {
    if (!shouldRunMigration()) {
        return
    }

    console.log('Ilaris | Running weapon eigenschaften parametrization migration for world...')

    try {
        // Migrate world actors
        const actorResults = await migrateAllHeldActors()

        // Migrate compendiums
        const compendiumsToMigrate = ['Ilaris.waffen', 'Ilaris.beispiel-helden']

        let totalCompendiumWeapons = 0
        for (const packId of compendiumsToMigrate) {
            try {
                const count = await migrateCompendiumWeapons(packId)
                totalCompendiumWeapons += count
            } catch (error) {
                console.error(`Ilaris | Error migrating compendium ${packId}:`, error)
            }
        }

        if (totalCompendiumWeapons > 0) {
            ui.notifications.info(
                `Ilaris: Migrated ${totalCompendiumWeapons} weapons in compendiums.`,
            )
        }

        // Update world schema version
        await game.settings.set('Ilaris', 'worldSchemaVersion', '12.3.0')

        console.log('Ilaris | Parametrization migration completed successfully')
    } catch (error) {
        console.error('Ilaris | Migration failed:', error)
        ui.notifications.error('Ilaris: Weapon migration failed. Check console for details.')
    }
}
