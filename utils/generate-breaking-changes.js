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
import { marked } from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Parse the CHANGELOG.md file to extract breaking changes for a specific version
 * @param {string} changelogText - The full text of the CHANGELOG.md file
 * @param {string} version - The version to extract (e.g., "12.2")
 * @returns {string|null} Markdown formatted breaking changes or null if none found
 */
function parseBreakingChanges(changelogText, version) {
    // Flexible Regex für Breaking Changes Überschriften
    // Unterstützt: Emoji, Singular/Plural, Groß-/Kleinschreibung, optionaler Doppelpunkt
    // Erfasst alles von der Breaking Changes Überschrift bis zur Horizontal Rule (---)
    const breakingChangesRegex = new RegExp(
        `^###\\s+(?:v|\\[)?${version.replace('.', '\\.')}\\]?.*?$` + // Version Header (mit optionalem 'v' Präfix)
            `[\\s\\S]*?` + // Beliebiger Inhalt bis...
            `^####\\s*(?:⚠️\\s*)?breaking\\s+change(?:s)?\\s*:?\\s*$` + // Breaking Changes Überschrift (case-insensitive, flexibel)
            `([\\s\\S]*?)` + // Capture: Inhalt
            `^---\\s*$`, // Horizontal rule am Zeilenende
        'im', // i = case-insensitive, m = multiline
    )

    const match = changelogText.match(breakingChangesRegex)
    if (!match || !match[1]) {
        return null
    }

    return match[1].trim()
}

/**
 * Convert Markdown to HTML using marked library
 * @param {string} markdown - The Markdown content to convert
 * @returns {string} HTML content
 */
function markdownToHtml(markdown) {
    // 'marked' parst zuverlässig Listen, Fettdruck, Links, etc.
    // Die Option 'headerIds: false' verhindert automatisch generierte IDs für Überschriften
    return marked.parse(markdown.trim(), { headerIds: false })
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
    // Remove old .hbs files (keep only current version)
    const breakingChangesFiles = files.filter(
        (f) => f.startsWith('breaking-changes-') && f.endsWith('.hbs'),
    )

    let deletedCount = 0
    breakingChangesFiles.forEach((file) => {
        // Keep only the current version .hbs file
        if (file !== `breaking-changes-${currentVersion}.hbs`) {
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
 * Generate the Handlebars (.hbs) file with HTML content
 * @param {string} version - The version number
 * @param {string} breakingChanges - The breaking changes content (Markdown)
 */
function generateHbsFile(version, breakingChanges) {
    // Ensure the templates/changes directory exists
    const outputDir = path.join(__dirname, '..', 'templates', 'changes')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Clean up old breaking changes files before generating new one
    cleanupOldBreakingChanges(version)

    // Convert Markdown to HTML using marked
    const htmlContent = markdownToHtml(breakingChanges)

    // Write the .hbs file with HTML content
    const outputPath = path.join(outputDir, `breaking-changes-${version}.hbs`)
    fs.writeFileSync(outputPath, htmlContent, 'utf-8')

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
            console.log(`ℹ️ No breaking changes found for version ${majorMinorVersion}`)

            // Clean up any existing breaking changes file for this version
            const outputDir = path.join(__dirname, '..', 'templates', 'changes')
            const hbsPath = path.join(outputDir, `breaking-changes-${majorMinorVersion}.hbs`)

            if (fs.existsSync(hbsPath)) {
                fs.unlinkSync(hbsPath)
                console.log(`🗑️ Removed old breaking changes file: ${hbsPath}`)
            }

            process.exit(0) // Erfolg, auch ohne Breaking Changes
        }

        // Generate .hbs file with HTML content from Markdown
        generateHbsFile(majorMinorVersion, breakingChangesMarkdown)

        console.log('✅ Breaking changes template generated successfully!')
        process.exit(0) // Erfolg
    } catch (error) {
        console.error('❌ Error generating breaking changes:', error.message)
        process.exit(1) // Echter Fehler
    }
}

// Run the script
main()
