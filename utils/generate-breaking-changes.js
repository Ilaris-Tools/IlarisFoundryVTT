#!/usr/bin/env node

/**
 * Validate the release section in CHANGELOG.md and generate the static
 * Handlebars template consumed by the in-app release notification.
 */

import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import { parseReleaseMetadata } from './changelog-parser.js'

const __dirname = path.join(process.cwd(), 'utils')
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
const systemJsonPath = path.join(__dirname, '..', 'system.json')
export const breakingChangesTemplateDir = path.join(
    __dirname,
    '..',
    'scripts',
    'changelog',
    'templates',
)

export { parseReleaseMetadata }

export function markdownToHtml(markdown) {
    return marked.parse(markdown.trim(), { headerIds: false })
}

export function cleanupOldBreakingChanges(currentVersion) {
    if (!fs.existsSync(breakingChangesTemplateDir)) return
    const majorVersion = currentVersion.split('.')[0]

    for (const file of fs.readdirSync(breakingChangesTemplateDir)) {
        const isTemplate = file.startsWith('breaking-changes-') && file.endsWith('.hbs')
        const isMetadata = file.startsWith('release-metadata-') && file.endsWith('.json')
        const isMajorMetadata = file === `release-metadata-major-${majorVersion}.json`
        if (!isTemplate && !isMetadata) continue
        if (
            file !== `breaking-changes-${currentVersion}.hbs` &&
            file !== `release-metadata-${currentVersion}.json` &&
            !isMajorMetadata
        ) {
            fs.unlinkSync(path.join(breakingChangesTemplateDir, file))
            console.log(`Removed old breaking changes file: ${file}`)
        }
    }
}

export function generateHbsFile(version, breakingChanges, metadata = {}) {
    fs.mkdirSync(breakingChangesTemplateDir, { recursive: true })
    cleanupOldBreakingChanges(version)
    const outputPath = path.join(breakingChangesTemplateDir, `breaking-changes-${version}.hbs`)
    fs.writeFileSync(outputPath, markdownToHtml(breakingChanges), 'utf-8')
    const metadataJson =
        JSON.stringify(
            {
                version: metadata.version ?? version,
                majorVersion: metadata.majorVersion ?? version.split('.')[0],
                hasBreakingChanges: metadata.hasBreakingChanges ?? true,
                importRequired: metadata.importRequired ?? false,
                tutorials: metadata.tutorials ?? [],
            },
            null,
            2,
        ) + '\n'
    fs.writeFileSync(
        path.join(breakingChangesTemplateDir, `release-metadata-${version}.json`),
        metadataJson,
        'utf-8',
    )
    if (version.endsWith('.0')) {
        fs.writeFileSync(
            path.join(
                breakingChangesTemplateDir,
                `release-metadata-major-${version.split('.')[0]}.json`,
            ),
            metadataJson,
            'utf-8',
        )
    }
    console.log(`Generated breaking changes template: ${outputPath}`)
    return outputPath
}

export function main() {
    const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, 'utf-8'))
    const changelogText = fs.readFileSync(changelogPath, 'utf-8')
    const metadata = parseReleaseMetadata(changelogText, systemJson.version)

    console.log(`Processing version: ${metadata.version} (full: ${systemJson.version})`)
    if (!metadata.hasBreakingChanges) {
        cleanupOldBreakingChanges(metadata.version)
        console.log(`No breaking changes found for version ${metadata.version}`)
        return null
    }

    return generateHbsFile(metadata.version, metadata.markdown, metadata)
}

if (process.argv[1] && process.argv[1].endsWith('generate-breaking-changes.js')) {
    try {
        main()
    } catch (error) {
        console.error(`Error generating breaking changes: ${error.message}`)
        process.exitCode = 1
    }
}
