import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packsRootDir = path.join(__dirname, '..', 'comp_packs')

console.log('🔄 Updating _stats in compendium source files...\n')

let totalUpdated = 0
let totalSkipped = 0

// Get all pack directories
const packDirs = fs
    .readdirSync(packsRootDir)
    .filter((item) => {
        const packPath = path.join(packsRootDir, item)
        return fs.statSync(packPath).isDirectory()
    })
    .map((item) => path.join(packsRootDir, item))

for (const packDir of packDirs) {
    const sourcePath = path.join(packDir, '_source')

    if (!fs.existsSync(sourcePath)) {
        console.log(`⚠️  Skipping ${path.basename(packDir)} - no _source folder`)
        continue
    }

    console.log(`📦 Processing ${path.basename(packDir)}...`)

    const jsonFiles = fs
        .readdirSync(sourcePath)
        .filter(
            (file) => file.endsWith('.json') && fs.statSync(path.join(sourcePath, file)).isFile(),
        )

    for (const jsonFile of jsonFiles) {
        const jsonPath = path.join(sourcePath, jsonFile)

        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

            // Check if _stats needs updating
            if (data._stats && data._stats.coreVersion === '12.331') {
                // Update _stats to v13 compatible
                data._stats = {
                    compendiumSource: data._stats.compendiumSource || null,
                    duplicateSource: data._stats.duplicateSource || null,
                    coreVersion: '13.330',
                    systemId: 'Ilaris',
                    systemVersion: '13.0.0',
                    createdTime: data._stats.createdTime || null,
                    modifiedTime: Date.now(),
                    lastModifiedBy: data._stats.lastModifiedBy || null,
                }

                // Write back the modified JSON
                fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
                totalUpdated++
            } else {
                totalSkipped++
            }
        } catch (error) {
            console.error(`  ❌ Error processing ${jsonFile}:`, error.message)
        }
    }
}

console.log(`\n✅ Updated: ${totalUpdated} files`)
console.log(`⏭️  Skipped: ${totalSkipped} files`)
console.log('\n🎉 Done! Now run: node utils/pack-all.js')
