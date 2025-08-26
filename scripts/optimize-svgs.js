#!/usr/bin/env node

import { optimize } from 'svgo'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Recursively find all SVG files in a directory
 */
function findSvgFiles(dir) {
    const files = []
    const items = fs.readdirSync(dir)

    for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            files.push(...findSvgFiles(fullPath))
        } else if (path.extname(item) === '.svg') {
            files.push(fullPath)
        }
    }

    return files
}

/**
 * Optimize a single SVG file
 */
function optimizeSvg(filePath) {
    try {
        const input = fs.readFileSync(filePath, 'utf8')
        const originalSize = Buffer.byteLength(input, 'utf8')

        const result = optimize(input, {
            path: filePath,
        })

        if (result.error) {
            console.error(`Error optimizing ${filePath}:`, result.error)
            return false
        }

        const optimizedSize = Buffer.byteLength(result.data, 'utf8')
        const savings = originalSize - optimizedSize
        const savingsPercent = Math.round((savings / originalSize) * 100)

        // Only write if we actually saved space
        if (savings > 0) {
            fs.writeFileSync(filePath, result.data)
            console.log(
                `✓ ${path.basename(
                    filePath,
                )}: ${originalSize}B → ${optimizedSize}B (${savingsPercent}% saved)`,
            )
        } else {
            console.log(`- ${path.basename(filePath)}: already optimized`)
        }

        return { originalSize, optimizedSize, savings, savingsPercent }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message)
        return false
    }
}

/**
 * Main optimization function
 */
function main() {
    const assetsDir = path.join(__dirname, '..', 'assets')

    if (!fs.existsSync(assetsDir)) {
        console.error('Assets directory not found')
        process.exit(1)
    }

    console.log('Finding SVG files...')
    const svgFiles = findSvgFiles(assetsDir)

    if (svgFiles.length === 0) {
        console.log('No SVG files found')
        return
    }

    console.log(`Found ${svgFiles.length} SVG files`)
    console.log('Optimizing...\n')

    let totalOriginalSize = 0
    let totalOptimizedSize = 0
    let processedFiles = 0

    for (const filePath of svgFiles) {
        const result = optimizeSvg(filePath)
        if (result) {
            totalOriginalSize += result.originalSize
            totalOptimizedSize += result.optimizedSize
            processedFiles++
        }
    }

    const totalSavings = totalOriginalSize - totalOptimizedSize
    const totalSavingsPercent = Math.round((totalSavings / totalOriginalSize) * 100)

    console.log('\nOptimization complete!')
    console.log(`Processed: ${processedFiles} files`)
    console.log(`Total size: ${totalOriginalSize}B → ${totalOptimizedSize}B`)
    console.log(`Total savings: ${totalSavings}B (${totalSavingsPercent}%)`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export { optimizeSvg, findSvgFiles }
