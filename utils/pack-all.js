import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli'
import fs from 'fs'
import path from 'path'

// Get all pack directories that have a _source folder
const packsRootDir = 'packs'
const packDirs = []

if (fs.existsSync(packsRootDir)) {
    const items = fs.readdirSync(packsRootDir)
    for (const item of items) {
        const packPath = path.join(packsRootDir, item)
        const sourcePath = path.join(packPath, '_source')

        if (fs.statSync(packPath).isDirectory() && fs.existsSync(sourcePath)) {
            packDirs.push(packPath)
        }
    }
}

console.log(
    `Found ${packDirs.length} packs to process: ${packDirs
        .map((p) => path.basename(p))
        .join(', ')}`,
)

// Clean up existing pack files (except _source folder)
for (const packsDir of packDirs) {
    if (fs.existsSync(packsDir)) {
        const items = fs.readdirSync(packsDir)
        for (const item of items) {
            if (item !== '_source') {
                const itemPath = path.join(packsDir, item)
                const stat = fs.statSync(itemPath)
                if (stat.isFile()) {
                    fs.unlinkSync(itemPath)
                    console.log(`Deleted file: ${itemPath}`)
                } else if (stat.isDirectory()) {
                    fs.rmSync(itemPath, { recursive: true, force: true })
                    console.log(`Deleted directory: ${itemPath}`)
                }
            }
        }
    }
}

// Compile all LevelDB compendium packs
console.log('\nCompiling packs...')
for (const packDir of packDirs) {
    const sourcePath = path.join(packDir, '_source')
    try {
        compilePack(sourcePath, packDir, { log: false })
        console.log(`✅ Compiled: ${packDir}`)
    } catch (error) {
        console.error(`❌ Error compiling ${packDir}:`, error.message)
    }
}

// Delete LOCK files after packing
console.log('\nCleaning up LOCK files...')
function deleteLockFiles(dir) {
    if (!fs.existsSync(dir)) return

    const items = fs.readdirSync(dir)
    for (const item of items) {
        const itemPath = path.join(dir, item)
        const stat = fs.statSync(itemPath)

        if (stat.isDirectory()) {
            deleteLockFiles(itemPath) // Recursively check subdirectories
        } else if (item === 'LOCK') {
            try {
                fs.unlinkSync(itemPath)
                console.log(`🔓 Deleted LOCK file: ${itemPath}`)
            } catch (error) {
                console.error(`❌ Error deleting LOCK file ${itemPath}:`, error.message)
            }
        }
    }
}

// Delete LOCK files from all pack directories
for (const packDir of packDirs) {
    deleteLockFiles(packDir)
}

console.log('\n🎉 Pack compilation and LOCK file cleanup complete!')
