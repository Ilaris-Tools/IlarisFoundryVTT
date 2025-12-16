/**
 * Migration to convert weapon eigenschaften from object format to array format
 * Migration version: 12.2.6
 */

/**
 * Mapping from old property names to new eigenschaft names
 */
const EIGENSCHAFT_MAPPING = {
    kopflastig: 'Unberechenbar',
    niederwerfen: 'Niederwerfen',
    niederwerfen_4: 'Niederwerfen (+4)',
    niederwerfen_8: 'Niederwerfen (+8)',
    parierwaffe: 'Parierwaffe',
    reittier: 'Reittier',
    ruestungsbrechend: 'Rüstungsbrechend',
    schild: 'Schild',
    schwer_4: 'Schwer (+4)',
    schwer_8: 'Schwer (+8)',
    stationaer: 'stationär',
    stumpf: 'Stumpf',
    unberechenbar: 'Unberechenbar',
    unzerstoerbar: 'Unzerstörbar',
    wendig: 'Wendig',
    zerbrechlich: 'Zerbrechlich',
    zweihaendig: 'Zweihändig',
    umklammern: 'Umklammern',
    umklammern_2_12: 'Umklammern (±2/12)',
    umklammern_4_16: 'Umklammern (±4/16)',
    umklammern_8_16: 'Umklammern (±8/16)',
    // These properties are handled elsewhere or deprecated
    kein_malus_nebenwaffe: null,
    kein_reiter: null,
    umklammern_212: null,
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

    // Check if eigenschaften is an object (old format)
    return (
        weapon.system.eigenschaften &&
        typeof weapon.system.eigenschaften === 'object' &&
        !Array.isArray(weapon.system.eigenschaften)
    )
}

/**
 * Migrate a single weapon's eigenschaften from object to array format
 * @param {Item} weapon - The weapon item to migrate
 * @returns {string[]|null} - Array of eigenschaft names or null if no migration needed
 */
function migrateWeaponEigenschaften(weapon) {
    if (!needsMigration(weapon)) {
        return null
    }

    const eigenschaften = []

    for (const [key, value] of Object.entries(weapon.system.eigenschaften)) {
        if (value === true) {
            const mappedName = EIGENSCHAFT_MAPPING[key]
            if (mappedName) {
                eigenschaften.push(mappedName)
            } else if (!EIGENSCHAFT_MAPPING.hasOwnProperty(key)) {
                console.warn(
                    `Ilaris | Unknown eigenschaft property during migration: ${key} on weapon ${weapon.name}`,
                )
            }
        }
    }

    return eigenschaften
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
    console.log('Ilaris | Starting weapon eigenschaften migration...')

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
            `Ilaris: Migrated ${weaponCount} weapons on ${actorCount} held actors to new eigenschaften format.`,
        )
    }

    console.log(`Ilaris | Migration complete: ${weaponCount} weapons on ${actorCount} actors`)

    return { actors: actorCount, weapons: weaponCount }
}

/**
 * Check if migration should run
 * Migration runs once per world when:
 * - User is GM
 * - World schema version is less than 12.2.6
 *
 * @returns {boolean}
 */
export function shouldRunMigration() {
    if (!game.user.isGM) {
        return false
    }

    const worldSchemaVersion = game.settings.get('Ilaris', 'worldSchemaVersion') || '0.0.0'

    // Check if world schema version is less than 12.2.6
    return isNewerVersion('12.2.6', worldSchemaVersion)
}

/**
 * Run the migration if needed
 */
export async function runMigrationIfNeeded() {
    if (!shouldRunMigration()) {
        return
    }

    console.log('Ilaris | Running weapon eigenschaften migration for world...')

    try {
        await migrateAllHeldActors()

        // Update world schema version
        await game.settings.set('Ilaris', 'worldSchemaVersion', '12.2.6')

        console.log('Ilaris | Migration completed successfully')
    } catch (error) {
        console.error('Ilaris | Migration failed:', error)
        ui.notifications.error('Ilaris: Weapon migration failed. Check console for details.')
    }
}
