import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli'
import fs from 'fs'
import path from 'path'

// Clean up existing pack files (except _source folder)
const packDirs = ['packs/vorteile', 'packs/manover']
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

// Compile a LevelDB compendium pack.
compilePack('packs/vorteile/_source', 'packs/vorteile', { log: false })
compilePack('packs/manover/_source', 'packs/manover', { log: false })
