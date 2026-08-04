const releaseHeaderRegex = /^###\s+v?(\d+\.\d+(?:\.\d+)?)\s*$/i
const majorHeaderRegex = /^##\s+v?(\d+)\s*$/i
const breakingHeaderRegex = /^####\s*(?:[^\p{L}\r\n]*\s*)?breaking\s+changes?\s*:?\s*$/iu
const importMarkerRegex = /^\s*Import erforderlich\s*:\s*(Ja|Nein)\s*$/i
const tutorialsMarkerRegex = /^\s*Tutorials\s*:\s*(.+?)\s*$/i
const tutorialReferenceRegex = /@UUID\[[^\]]+\](?:\{[^}]+\})?|\[[^\]]+\]\([^\s)]+\)/g

function findSectionEnd(lines, startIndex, headerRegex) {
    for (let index = startIndex + 1; index < lines.length; index++) {
        if (headerRegex.test(lines[index])) return index
    }
    return lines.length
}

function findHeaderIndex(lines, regex, expectedValue) {
    return lines.findIndex((line) => {
        const match = line.match(regex)
        return match && (!expectedValue || match[1] === expectedValue)
    })
}

function parseTutorials(lines) {
    const markerIndex = lines.findIndex((line) => tutorialsMarkerRegex.test(line))
    if (markerIndex === -1) return []

    const marker = lines[markerIndex].match(tutorialsMarkerRegex)[1]
    const tutorials = marker.match(tutorialReferenceRegex) || []
    if (tutorials.length === 0) {
        throw new Error(
            'Tutorials marker must contain at least one @UUID[...] or Markdown link reference.',
        )
    }
    return tutorials
}

export function parseReleaseMetadata(changelogText, systemVersion) {
    const lines = changelogText.split(/\r?\n/)
    const releaseVersion = systemVersion.split('.').slice(0, 2).join('.')
    const majorVersion = releaseVersion.split('.')[0]

    if (findHeaderIndex(lines, majorHeaderRegex, majorVersion) === -1) {
        throw new Error(`Missing major changelog heading: ## v${majorVersion}`)
    }

    const releaseStart = findHeaderIndex(lines, releaseHeaderRegex, releaseVersion)
    if (releaseStart === -1) {
        throw new Error(`Missing release changelog heading: ### v${releaseVersion}`)
    }

    const releaseEnd = findSectionEnd(lines, releaseStart, /^###\s+/)
    const releaseLines = lines.slice(releaseStart, releaseEnd)
    const breakingStart = releaseLines.findIndex((line) => breakingHeaderRegex.test(line))

    if (breakingStart === -1) {
        return {
            version: releaseVersion,
            majorVersion,
            hasBreakingChanges: false,
            importRequired: false,
            tutorials: [],
            markdown: null,
        }
    }

    const breakingEnd = findSectionEnd(releaseLines, breakingStart, /^#{2,4}\s+/)
    const breakingLines = releaseLines.slice(breakingStart + 1, breakingEnd)
    const importMarkerIndex = breakingLines.findIndex((line) => importMarkerRegex.test(line))
    if (importMarkerIndex === -1) {
        throw new Error(
            `Breaking changes for v${releaseVersion} must declare "Import erforderlich: Ja" or "Import erforderlich: Nein".`,
        )
    }

    const importRequired =
        breakingLines[importMarkerIndex].match(importMarkerRegex)[1].toLowerCase() === 'ja'
    const tutorials = parseTutorials(breakingLines)
    if (releaseVersion.endsWith('.0') && tutorials.length === 0) {
        throw new Error(
            `Major release v${releaseVersion} must reference at least one existing tutorial.`,
        )
    }

    const contentLines = breakingLines.filter(
        (line, index) => index !== importMarkerIndex && !tutorialsMarkerRegex.test(line),
    )
    const content = contentLines.join('\n').trim()
    const disclaimer = importRequired
        ? '**WICHTIG: Charaktere müssen nach diesem Update neu importiert werden.**\n\n'
        : ''

    return {
        version: releaseVersion,
        majorVersion,
        hasBreakingChanges: true,
        importRequired,
        tutorials,
        markdown:
            `### v${releaseVersion}\n\n#### Breaking Changes\n\n${disclaimer}${content}`.trim(),
    }
}
