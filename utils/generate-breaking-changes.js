#!/usr/bin/env node

/**
 * Script to generate a Handlebars template file with breaking changes from CHANGELOG.md
 * This should be run as part of the build/deployment process
 *
 * Usage: node utils/generate-breaking-changes.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Parse the CHANGELOG.md file to extract breaking changes for a specific version
 * @param {string} changelogText - The full text of the CHANGELOG.md file
 * @param {string} version - The version to extract (e.g., "12.2")
 * @returns {string|null} Markdown formatted breaking changes or null if none found
 */
function parseBreakingChanges(changelogText, version) {
    // Match the version section (e.g., "### v12.2")
    const versionRegex = new RegExp(
        `###\\s+v${version.replace('.', '\\.')}\\s*\\n[\\s\\S]*?(?=\\n###\\s+v|\\n##\\s+v|$)`,
        'i',
    )

    const versionMatch = changelogText.match(versionRegex)

    if (!versionMatch) {
        return null
    }

    const versionSection = versionMatch[0]

    // Look for "#### Breaking Change" section with flexible variants:
    // - Optional emoji at the beginning (⚠️, etc.)
    // - "Breaking" or "BREAKING" (case-insensitive)
    // - Optional "Change" or "Changes"
    // - Optional colon at the end
    // Extract everything after the heading until the next --- (horizontal rule)
    const breakingChangeRegex =
        /####\s*(?:[^\w\s]+\s*)?breaking(?:\s+changes?)?\s*:?\s*\n+([\s\S]*?)(?=\n---|\n####[^#]|$)/i
    const breakingMatch = versionSection.match(breakingChangeRegex)

    if (!breakingMatch) {
        return null
    }

    // Extract the content after the Breaking Change heading and trim whitespace
    return breakingMatch[1].trim()
}

/**
 * Clean up old breaking changes files
 * @param {string} currentVersion - The current version to keep
 */
function cleanupOldBreakingChanges(currentVersion) {
    const outputDir = path.join(__dirname, '..', 'templates', 'changes')

    if (!fs.existsSync(outputDir)) {
        return
    }

    const files = fs.readdirSync(outputDir)
    // Remove both old .md files and legacy .hbs files
    const breakingChangesFiles = files.filter(
        (f) => f.startsWith('breaking-changes-') && (f.endsWith('.md') || f.endsWith('.hbs')),
    )

    let deletedCount = 0
    breakingChangesFiles.forEach((file) => {
        // Keep only the current version .md file
        if (file !== `breaking-changes-${currentVersion}.md`) {
            const filePath = path.join(outputDir, file)
            fs.unlinkSync(filePath)
            console.log(`🗑️  Removed old breaking changes file: ${file}`)
            deletedCount++
        }
    })

    if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} old breaking changes file(s)`)
    }
}

/**
 * Generate the Markdown file
 * @param {string} version - The version number
 * @param {string} breakingChanges - The breaking changes content (Markdown)
 */
function generateMdFile(version, breakingChanges) {
    // Ensure the templates/changes directory exists
    const outputDir = path.join(__dirname, '..', 'templates', 'changes')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Clean up old breaking changes files before generating new one
    cleanupOldBreakingChanges(version)

    // Write the pure Markdown file
    const outputPath = path.join(outputDir, `breaking-changes-${version}.md`)
    fs.writeFileSync(outputPath, breakingChanges, 'utf-8')

    console.log(`✅ Generated breaking changes template: ${outputPath}`)
    return outputPath
}

/**
 * Main function
 */
function main() {
    try {
        // Read system.json to get current version
        const systemJsonPath = path.join(__dirname, '..', 'system.json')
        const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, 'utf-8'))
        const currentVersion = systemJson.version

        // Extract major.minor version (e.g., "12.2.3" -> "12.2")
        const majorMinorVersion = currentVersion.split('.').slice(0, 2).join('.')

        console.log(`📖 Processing version: ${majorMinorVersion} (full: ${currentVersion})`)

        // Read CHANGELOG.md
        const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
        if (!fs.existsSync(changelogPath)) {
            console.error('❌ CHANGELOG.md not found!')
            process.exit(1)
        }

        const changelogText = fs.readFileSync(changelogPath, 'utf-8')

        // Parse breaking changes
        const breakingChangesMarkdown = parseBreakingChanges(changelogText, majorMinorVersion)

        if (!breakingChangesMarkdown) {
            console.log(`ℹ️  No breaking changes found for version ${majorMinorVersion}`)

            // Clean up any existing breaking changes file for this version
            const outputDir = path.join(__dirname, '..', 'templates', 'changes')
            const mdPath = path.join(outputDir, `breaking-changes-${majorMinorVersion}.md`)
            const hbsPath = path.join(outputDir, `breaking-changes-${majorMinorVersion}.hbs`)

            if (fs.existsSync(mdPath)) {
                fs.unlinkSync(mdPath)
                console.log(`🗑️  Removed old breaking changes file: ${mdPath}`)
            }
            if (fs.existsSync(hbsPath)) {
                fs.unlinkSync(hbsPath)
                console.log(`🗑️  Removed old breaking changes file: ${hbsPath}`)
            }

            process.exit(0)
        }

        // Generate Markdown file (no HTML conversion needed)
        generateMdFile(majorMinorVersion, breakingChangesMarkdown)

        console.log('✅ Breaking changes template generated successfully!')
    } catch (error) {
        console.error('❌ Error generating breaking changes:', error)
        process.exit(1)
    }
}

// Run the script
main()
