/**
 * Dialog to display breaking changes and important announcements from the CHANGELOG.md
 */
class ChangelogNotificationDialog extends foundry.applications.api.DialogV2 {
    constructor(options = {}) {
        super(options)
    }
}

/**
 * Parse the CHANGELOG.md file to extract breaking changes for a specific version
 * @param {string} changelogText - The full text of the CHANGELOG.md file
 * @param {string} version - The version to extract (e.g., "12.2")
 * @returns {string|null} HTML formatted breaking changes or null if none found
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
    let breakingContent = breakingMatch[1].trim()

    // Convert markdown list items to HTML
    breakingContent = breakingContent.replace(/^-\s+(.+)$/gm, '<li>$1</li>')

    // Wrap in ul if there are list items
    if (breakingContent.includes('<li>')) {
        breakingContent = `<ul>${breakingContent}</ul>`
    }

    return breakingContent
}

/**
 * Fetch and parse the CHANGELOG.md file
 * @returns {Promise<string>} The text content of the CHANGELOG.md
 */
async function fetchChangelog() {
    try {
        // Use dynamic path based on the actual system ID
        const systemPath = `systems/${game.system.id}/CHANGELOG.md`
        const response = await fetch(systemPath)
        if (!response.ok) {
            throw new Error(`Failed to fetch CHANGELOG.md: ${response.statusText}`)
        }
        return await response.text()
    } catch (error) {
        console.error('Ilaris | Error fetching CHANGELOG.md:', error)
        console.error('Ilaris | Attempted path:', `systems/${game.system.id}/CHANGELOG.md`)
        return null
    }
}

/**
 * Show the changelog notification dialog with breaking changes
 * @param {string} version - The current system version
 * @param {string} breakingChanges - HTML formatted breaking changes
 */
function showChangelogNotification(version, breakingChanges) {
    const content = `
        <div class="ilaris-changelog-content">
            <p><strong>Version ${version} enthält wichtige Änderungen, die deine Aufmerksamkeit erfordern:</strong></p>
            <p style="margin-top: 1em; font-style: italic;">
                Diese Nachricht wird nur einmal angezeigt. Du kannst die vollständigen Änderungen jederzeit im CHANGELOG.md einsehen.
            </p>
            ${breakingChanges}
        </div>
    `

    new ChangelogNotificationDialog({
        window: {
            title: 'Wichtige Änderungen / Breaking Changes',
            icon: 'fas fa-exclamation-triangle',
        },
        classes: ['ilaris-changelog-notification'],
        position: {
            width: 600,
        },
        content,
        buttons: [
            {
                action: 'acknowledge',
                icon: 'fas fa-check',
                label: 'Verstanden',
                default: true,
                callback: async () => {
                    // Mark this version as seen
                    await game.settings.set('Ilaris', 'lastSeenChangelogVersion', version)
                },
            },
        ],
    }).render(true)
}

/**
 * Check if we should show the changelog notification
 * Shows once per version for all users when there are breaking changes
 */
async function checkAndShowChangelogNotification() {
    try {
        // Get the current system version
        const currentVersion = game.system.version
        const majorMinorVersion = currentVersion.split('.').slice(0, 2).join('.') // e.g., "12.2.0" -> "12.2"

        // Check if we've already shown this version
        const lastSeenVersion = game.settings.get('Ilaris', 'lastSeenChangelogVersion')

        if (lastSeenVersion === majorMinorVersion) {
            return
        }

        // Fetch and parse the changelog
        const changelogText = await fetchChangelog()
        if (!changelogText) {
            return
        }

        // Extract breaking changes for this version
        const breakingChanges = parseBreakingChanges(changelogText, majorMinorVersion)
        if (!breakingChanges) {
            // Still mark as seen so we don't check again
            await game.settings.set('Ilaris', 'lastSeenChangelogVersion', majorMinorVersion)
            return
        }

        // Show the notification
        showChangelogNotification(majorMinorVersion, breakingChanges)
    } catch (error) {
        console.error('Ilaris | Error in changelog notification:', error)
    }
}

// Hook into the world ready event
Hooks.once('ready', async function () {
    // Small delay to ensure settings are fully loaded
    setTimeout(async () => {
        await checkAndShowChangelogNotification()
    }, 1000)
})
