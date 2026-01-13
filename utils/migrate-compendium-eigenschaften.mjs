#!/usr/bin/env node

/**
 * Migration script for weapon eigenschaften in compendia
 * Converts string arrays to object arrays with parameters
 *
 * Usage: node utils/migrate-compendium-eigenschaften.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Migration mapping for known legacy formats
const EIGENSCHAFT_MIGRATION_MAP = {
    // Schwer variants
    'Schwer (4)': { key: 'Schwer', parameters: [4] },
    'Schwer (+4)': { key: 'Schwer', parameters: [4] },
    'Schwer (8)': { key: 'Schwer', parameters: [8] },
    'Schwer (+8)': { key: 'Schwer', parameters: [8] },
    schwer_4: { key: 'Schwer', parameters: [4] },
    schwer_8: { key: 'Schwer', parameters: [8] },

    // Niederwerfen variants
    'Niederwerfen (+4)': { key: 'Niederwerfen', parameters: [4] },
    'Niederwerfen (+8)': { key: 'Niederwerfen', parameters: [8] },
    niederwerfen_4: { key: 'Niederwerfen', parameters: [4] },
    niederwerfen_8: { key: 'Niederwerfen', parameters: [8] },

    // Umklammern variants
    'Umklammern (-2; 12)': { key: 'Umklammern', parameters: [-2, 12] },
    'Umklammern (±2/12)': { key: 'Umklammern', parameters: [-2, 12] },
    'Umklammern (-4; 16)': { key: 'Umklammern', parameters: [-4, 16] },
    'Umklammern (±4/16)': { key: 'Umklammern', parameters: [-4, 16] },
    'Umklammern (-8; 16)': { key: 'Umklammern', parameters: [-8, 16] },
    'Umklammern (±8/16)': { key: 'Umklammern', parameters: [-8, 16] },
    umklammern_212: { key: 'Umklammern', parameters: [-2, 12] },
    umklammern_2_12: { key: 'Umklammern', parameters: [-2, 12] },

    // Simple properties (no parameters)
    Zweihändig: { key: 'Zweihändig', parameters: [] },
    zweihaendig: { key: 'Zweihändig', parameters: [] },
    Leicht: { key: 'Leicht', parameters: [] },
    Kopflastig: { key: 'Kopflastig', parameters: [] },
    Messerstecherei: { key: 'Messerstecherei', parameters: [] },
    Parierwaffe: { key: 'Parierwaffe', parameters: [] },
    Präzise: { key: 'Präzise', parameters: [] },
    Unhandlich: { key: 'Unhandlich', parameters: [] },
    Vielseitig: { key: 'Vielseitig', parameters: [] },
    Wuchtig: { key: 'Wuchtig', parameters: [] },
}

/**
 * Parse eigenschaft string into object format
 */
function parseEigenschaftString(str) {
    if (!str || typeof str !== 'string') return null

    const trimmed = str.trim()
    const match = trimmed.match(/^([^(]+?)(?:\s*\((.+)\))?$/)

    if (!match) return null

    const key = match[1].trim()
    const paramsString = match[2]

    if (!paramsString) {
        return { key, parameters: [] }
    }

    // Parse parameters - split by semicolon or comma
    const parameters = paramsString
        .split(/[;,]/)
        .map((p) => {
            const cleaned = p.trim().replace(/^[±+]/, '')
            const num = Number(cleaned)
            if (!isNaN(num) && cleaned !== '') {
                return p.trim().startsWith('-') ? -Math.abs(num) : num
            }
            return p.trim()
        })
        .filter((p) => p !== '')

    return { key, parameters }
}

/**
 * Migrate eigenschaften array from string to object format
 */
function migrateEigenschaften(eigenschaften) {
    if (!Array.isArray(eigenschaften)) return []

    // Already migrated?
    if (eigenschaften.length > 0 && eigenschaften[0]?.key !== undefined) {
        return eigenschaften
    }

    return eigenschaften
        .map((eig) => {
            // Try migration map first
            if (EIGENSCHAFT_MIGRATION_MAP[eig]) {
                return EIGENSCHAFT_MIGRATION_MAP[eig]
            }

            // Parse as string
            if (typeof eig === 'string') {
                const parsed = parseEigenschaftString(eig)
                if (parsed) return parsed

                // Fallback: treat as simple property
                return { key: eig, parameters: [] }
            }

            // Unknown format
            console.warn(`Unknown eigenschaft format: ${JSON.stringify(eig)}`)
            return null
        })
        .filter((e) => e !== null)
}

/**
 * Migrate eigenschaften in a weapon object (modifies in place)
 */
function migrateWeaponEigenschaften(weapon) {
    if (!weapon.system?.eigenschaften) return false

    const eigenschaften = weapon.system.eigenschaften

    // Already migrated?
    if (
        Array.isArray(eigenschaften) &&
        eigenschaften.length > 0 &&
        eigenschaften[0]?.key !== undefined
    ) {
        return false
    }

    // Migrate
    weapon.system.eigenschaften = migrateEigenschaften(eigenschaften)
    return true
}

/**
 * Migrate a single weapon file
 */
function migrateWeaponFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const weapon = JSON.parse(content)

    // Only process weapon items
    if (weapon.type !== 'nahkampfwaffe' && weapon.type !== 'fernkampfwaffe') {
        return { migrated: false, reason: 'not a weapon' }
    }

    const migrated = migrateWeaponEigenschaften(weapon)

    if (!migrated) {
        return { migrated: false, reason: 'already migrated or no eigenschaften' }
    }

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(weapon, null, 2) + '\n')

    return { migrated: true }
}

/**
 * Migrate an actor file with embedded weapon items
 */
function migrateActorFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const actor = JSON.parse(content)

    // Only process actor documents
    if (actor.type !== 'held' && actor.type !== 'npc') {
        return { migrated: 0, reason: 'not an actor' }
    }

    // Check if actor has items
    if (!actor.items || !Array.isArray(actor.items)) {
        return { migrated: 0, reason: 'no items' }
    }

    let migratedCount = 0

    // Migrate weapons in actor's items
    for (const item of actor.items) {
        if (item.type === 'nahkampfwaffe' || item.type === 'fernkampfwaffe') {
            if (migrateWeaponEigenschaften(item)) {
                migratedCount++
            }
        }
    }

    if (migratedCount === 0) {
        return { migrated: 0, reason: 'no weapons to migrate' }
    }

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(actor, null, 2) + '\n')

    return { migrated: migratedCount }
}

/**
 * Migrate all weapons in a compendium source directory
 */
function migrateCompendiumSource(packName) {
    const sourceDir = path.join(__dirname, '..', 'packs', packName, '_source')

    if (!fs.existsSync(sourceDir)) {
        console.error(`ERROR: Source directory not found: ${sourceDir}`)
        console.error(`Run "fvtt package unpack ${packName}" first!`)
        return
    }

    const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.json'))

    console.log(`\nMigrating ${packName} (${files.length} files)...`)

    let migratedFiles = 0
    let migratedWeapons = 0
    let skipped = 0
    let errors = 0

    for (const file of files) {
        const filePath = path.join(sourceDir, file)
        try {
            const content = fs.readFileSync(filePath, 'utf-8')
            const doc = JSON.parse(content)

            // Try weapon migration
            if (doc.type === 'nahkampfwaffe' || doc.type === 'fernkampfwaffe') {
                const result = migrateWeaponFile(filePath)
                if (result.migrated) {
                    migratedFiles++
                    migratedWeapons++
                    console.log(`  ✓ ${file}`)
                } else {
                    skipped++
                }
            }
            // Try actor migration
            else if (doc.type === 'held' || doc.type === 'npc') {
                const result = migrateActorFile(filePath)
                if (result.migrated > 0) {
                    migratedFiles++
                    migratedWeapons += result.migrated
                    console.log(`  ✓ ${file} (${result.migrated} weapons)`)
                } else {
                    skipped++
                }
            }
            // Other document types
            else {
                skipped++
            }
        } catch (error) {
            errors++
            console.error(`  ✗ ${file}: ${error.message}`)
        }
    }

    console.log(`\nResults for ${packName}:`)
    console.log(`  Files migrated: ${migratedFiles}`)
    console.log(`  Weapons migrated: ${migratedWeapons}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Errors: ${errors}`)
}

// Main execution
console.log('=== Waffeneigenschaften Compendium Migration ===\n')

// Migrate weapon packs
migrateCompendiumSource('waffen')
migrateCompendiumSource('beispiel-helden')

console.log('\n✓ Migration complete!')
console.log('\nNext steps:')
console.log('  1. Review the migrated files in packs/*/source/')
console.log('  2. Run: fvtt package pack waffen')
console.log('  3. Run: fvtt package pack beispiel-helden')
console.log('  4. Restart Foundry VTT')
