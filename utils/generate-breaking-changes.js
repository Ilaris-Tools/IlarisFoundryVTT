#!/usr/bin/env node

/**
 * Script to generate a Handlebars template file with breaking changes from CHANGELOG.md
 * This should be run as part of the build/deployment process
 *
 * Usage: node scripts/generate-breaking-changes.js
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

    // Look for "#### Breaking Change" section
    const breakingChangeRegex = /####\s+Breaking\s+Change[^\n]*\n+([\s\S]*?)(?=\n####|\n###|$)/i
    const breakingMatch = versionSection.match(breakingChangeRegex)

    if (!breakingMatch) {
        return null
    }

    // Extract the content after "#### Breaking Change"
    return breakingMatch[1].trim()
}

/**
 * Convert markdown list items to HTML
 * @param {string} markdown - Markdown text
 * @returns {string} HTML formatted text
 */
function markdownToHtml(markdown) {
    // Convert list items
    let html = markdown.replace(/^-\s+(.+)$/gm, '<li>$1</li>')

    // Wrap in ul if there are list items
    if (html.includes('<li>')) {
        html = `<ul>${html}</ul>`
    }

    return html
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
    const breakingChangesFiles = files.filter(
        (f) => f.startsWith('breaking-changes-') && f.endsWith('.hbs'),
    )

    let deletedCount = 0
    breakingChangesFiles.forEach((file) => {
        // Keep only the current version file
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
 * Generate the HBS template file
 * @param {string} version - The version number
 * @param {string} breakingChanges - The breaking changes content (HTML)
 */
function generateHbsFile(version, breakingChanges) {
    const template = `<div class="ilaris-changelog-content">
    <p><strong>Version ${version} enthält wichtige Änderungen, die deine Aufmerksamkeit erfordern:</strong></p>
    <p style="margin-top: 1em; font-style: italic;">
        Diese Nachricht wird nur einmal angezeigt. Du kannst die vollständigen Änderungen jederzeit im CHANGELOG.md einsehen.
    </p>
    ${breakingChanges}
</div>
`

    // Ensure the templates/changes directory exists
    const outputDir = path.join(__dirname, '..', 'templates', 'changes')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Clean up old breaking changes files before generating new one
    cleanupOldBreakingChanges(version)

    // Write the HBS file
    const outputPath = path.join(outputDir, `breaking-changes-${version}.hbs`)
    fs.writeFileSync(outputPath, template, 'utf-8')

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
            const outputPath = path.join(outputDir, `breaking-changes-${majorMinorVersion}.hbs`)
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath)
                console.log(`🗑️  Removed old breaking changes file: ${outputPath}`)
            }

            process.exit(0)
        }

        // Convert to HTML
        const breakingChangesHtml = markdownToHtml(breakingChangesMarkdown)

        // Generate HBS file
        generateHbsFile(majorMinorVersion, breakingChangesHtml)

        console.log('✅ Breaking changes template generated successfully!')
    } catch (error) {
        console.error('❌ Error generating breaking changes:', error)
        process.exit(1)
    }
}

// Run the script
main()
