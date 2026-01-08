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
  "Schwer (4)": { key: "Schwer", parameters: [4] },
  "Schwer (+4)": { key: "Schwer", parameters: [4] },
  "Schwer (8)": { key: "Schwer", parameters: [8] },
  "Schwer (+8)": { key: "Schwer", parameters: [8] },
  "schwer_4": { key: "Schwer", parameters: [4] },
  "schwer_8": { key: "Schwer", parameters: [8] },
  
  // Niederwerfen variants
  "Niederwerfen (+4)": { key: "Niederwerfen", parameters: [4] },
  "Niederwerfen (+8)": { key: "Niederwerfen", parameters: [8] },
  "niederwerfen_4": { key: "Niederwerfen", parameters: [4] },
  "niederwerfen_8": { key: "Niederwerfen", parameters: [8] },
  
  // Umklammern variants
  "Umklammern (-2; 12)": { key: "Umklammern", parameters: [-2, 12] },
  "Umklammern (±2/12)": { key: "Umklammern", parameters: [-2, 12] },
  "Umklammern (-4; 16)": { key: "Umklammern", parameters: [-4, 16] },
  "Umklammern (±4/16)": { key: "Umklammern", parameters: [-4, 16] },
  "Umklammern (-8; 16)": { key: "Umklammern", parameters: [-8, 16] },
  "Umklammern (±8/16)": { key: "Umklammern", parameters: [-8, 16] },
  "umklammern_212": { key: "Umklammern", parameters: [-2, 12] },
  "umklammern_2_12": { key: "Umklammern", parameters: [-2, 12] },
  
  // Simple properties (no parameters)
  "Zweihändig": { key: "Zweihändig", parameters: [] },
  "zweihaendig": { key: "Zweihändig", parameters: [] },
  "Leicht": { key: "Leicht", parameters: [] },
  "Kopflastig": { key: "Kopflastig", parameters: [] },
  "Messerstecherei": { key: "Messerstecherei", parameters: [] },
  "Parierwaffe": { key: "Parierwaffe", parameters: [] },
  "Präzise": { key: "Präzise", parameters: [] },
  "Unhandlich": { key: "Unhandlich", parameters: [] },
  "Vielseitig": { key: "Vielseitig", parameters: [] },
  "Wuchtig": { key: "Wuchtig", parameters: [] },
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
  const parameters = paramsString.split(/[;,]/).map(p => {
    const cleaned = p.trim().replace(/^[±+]/, '')
    const num = Number(cleaned)
    if (!isNaN(num) && cleaned !== '') {
      return p.trim().startsWith('-') ? -Math.abs(num) : num
    }
    return p.trim()
  }).filter(p => p !== '')
  
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
  
  return eigenschaften.map(eig => {
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
  }).filter(e => e !== null)
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
  
  // Check if eigenschaften exist
  if (!weapon.system.eigenschaften) {
    return { migrated: false, reason: 'no eigenschaften' }
  }
  
  // Check if already migrated
  const eigenschaften = weapon.system.eigenschaften
  if (Array.isArray(eigenschaften) && eigenschaften.length > 0 && eigenschaften[0]?.key !== undefined) {
    return { migrated: false, reason: 'already migrated' }
  }
  
  // Migrate
  weapon.system.eigenschaften = migrateEigenschaften(eigenschaften)
  
  // Write back
  fs.writeFileSync(filePath, JSON.stringify(weapon, null, 2) + '\n')
  
  return { migrated: true }
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
  
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'))
  
  console.log(`\nMigrating ${packName} (${files.length} files)...`)
  
  let migrated = 0
  let skipped = 0
  let errors = 0
  
  for (const file of files) {
    const filePath = path.join(sourceDir, file)
    try {
      const result = migrateWeaponFile(filePath)
      if (result.migrated) {
        migrated++
        console.log(`  ✓ ${file}`)
      } else {
        skipped++
        // console.log(`  - ${file} (${result.reason})`)
      }
    } catch (error) {
      errors++
      console.error(`  ✗ ${file}: ${error.message}`)
    }
  }
  
  console.log(`\nResults for ${packName}:`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Errors: ${errors}`)
}

// Main execution
console.log('=== Waffeneigenschaften Compendium Migration ===\n')

// Migrate weapon packs
migrateCompendiumSource('waffen')

console.log('\n✓ Migration complete!')
console.log('\nNext steps:')
console.log('  1. Review the migrated files in packs/*/source/')
console.log('  2. Run: fvtt package pack waffen')
console.log('  3. Run: fvtt package pack beispiel-helden')
console.log('  4. Restart Foundry VTT')
