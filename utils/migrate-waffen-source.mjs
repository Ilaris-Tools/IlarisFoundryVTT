/**
 * Standalone Node.js script to migrate weapon JSON files in packs/waffen/_source
 * Run with: node utils/migrate-waffen-source.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

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
 */
function isOldFormat(eigenschaften) {
    if (!eigenschaften) return false
    if (Array.isArray(eigenschaften)) return false
    if (typeof eigenschaften === 'object') return true
    return false
}

/**
 * Migrate eigenschaften from old object format to new array format
 */
function migrateEigenschaften(oldEigenschaften) {
    if (!isOldFormat(oldEigenschaften)) {
        return Array.isArray(oldEigenschaften) ? oldEigenschaften : []
    }

    const newEigenschaften = []

    for (const [key, value] of Object.entries(oldEigenschaften)) {
        if (!value) continue

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
 * Migrate a single weapon JSON file
 */
async function migrateWeaponFile(filePath, fileName) {
    try {
        const content = await readFile(filePath, 'utf-8')
        const weapon = JSON.parse(content)

        // Check if it's a weapon
        if (weapon.type !== 'nahkampfwaffe' && weapon.type !== 'fernkampfwaffe') {
            return { skipped: true, reason: 'not a weapon' }
        }

        // Check if eigenschaften needs migration
        if (!isOldFormat(weapon.system?.eigenschaften)) {
            return { skipped: true, reason: 'already in new format' }
        }

        // Migrate eigenschaften
        const oldEigenschaften = weapon.system.eigenschaften
        const newEigenschaften = migrateEigenschaften(oldEigenschaften)

        weapon.system.eigenschaften = newEigenschaften

        // Write back to file with pretty formatting
        await writeFile(filePath, JSON.stringify(weapon, null, 2) + '\n', 'utf-8')

        return {
            migrated: true,
            name: weapon.name,
            old: oldEigenschaften,
            new: newEigenschaften,
        }
    } catch (error) {
        return {
            error: true,
            message: error.message,
        }
    }
}

/**
 * Main migration function
 */
async function migrateWaffenPack() {
    const packPath = join(process.cwd(), 'packs', 'waffen', '_source')

    console.log(`\n🔄 Starting migration of weapons in: ${packPath}\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    try {
        const files = await readdir(packPath)
        const jsonFiles = files.filter((f) => f.endsWith('.json'))

        console.log(`Found ${jsonFiles.length} JSON files\n`)

        for (const fileName of jsonFiles) {
            const filePath = join(packPath, fileName)
            const result = await migrateWeaponFile(filePath, fileName)

            if (result.migrated) {
                migrated++
                console.log(`✅ ${fileName}`)
                console.log(`   Name: ${result.name}`)
                console.log(`   Old:  ${JSON.stringify(result.old)}`)
                console.log(`   New:  ${JSON.stringify(result.new)}`)
                console.log()
            } else if (result.skipped) {
                skipped++
                console.log(`⏭️  ${fileName} - ${result.reason}`)
            } else if (result.error) {
                errors++
                console.log(`❌ ${fileName} - ERROR: ${result.message}`)
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log('📊 Migration Summary:')
        console.log(`   Migrated: ${migrated}`)
        console.log(`   Skipped:  ${skipped}`)
        console.log(`   Errors:   ${errors}`)
        console.log(`   Total:    ${jsonFiles.length}`)
        console.log('='.repeat(60) + '\n')

        if (migrated > 0) {
            console.log('✨ Migration complete! Files have been updated.')
            console.log('⚠️  Remember to rebuild the compendium pack in Foundry!')
        } else {
            console.log('ℹ️  No weapons needed migration.')
        }
    } catch (error) {
        console.error('❌ Fatal error:', error.message)
        process.exit(1)
    }
}

// Run migration
migrateWaffenPack()
