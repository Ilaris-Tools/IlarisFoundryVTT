/**
 * Dialog to display breaking changes and important announcements from the CHANGELOG.md
 */
class ChangelogNotificationDialog extends foundry.applications.api.DialogV2 {
    constructor(options = {}) {
        super(options)
    }
}

/**
 * Fetch the pre-generated breaking changes template
 * @param {string} version - The version to fetch (e.g., "12.2")
 * @returns {Promise<string|null>} The HTML content or null if not found
 */
async function fetchBreakingChangesTemplate(version) {
    try {
        const templatePath = `systems/${game.system.id}/templates/changes/breaking-changes-${version}.hbs`
        const response = await fetch(templatePath)

        if (!response.ok) {
            // No breaking changes template exists for this version
            return null
        }

        return await response.text()
    } catch (error) {
        console.error('Ilaris | Error fetching breaking changes template:', error)
        return null
    }
}

/**
 * Show the changelog notification dialog with breaking changes
 * @param {string} version - The current system version
 * @param {string} content - HTML content with breaking changes
 */
function showChangelogNotification(version, content) {
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
                    await game.settings.set('Ilaris', 'lastSeenBreakingChangesVersion', version)
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
        const lastSeenVersion = game.settings.get('Ilaris', 'lastSeenBreakingChangesVersion')

        if (lastSeenVersion === majorMinorVersion) {
            return
        }

        // Fetch the pre-generated breaking changes template (already HTML from .hbs file)
        const breakingChangesHtml = await fetchBreakingChangesTemplate(majorMinorVersion)

        if (!breakingChangesHtml) {
            // No breaking changes for this version, mark as seen
            await game.settings.set('Ilaris', 'lastSeenBreakingChangesVersion', majorMinorVersion)
            return
        }

        // Apply Foundry's enrichHTML for @UUID links, etc.
        const enrichedHtml = await TextEditor.enrichHTML(breakingChangesHtml, { async: true })

        // Wrap the enriched content with additional context
        const fullContent = `<div class="ilaris-changelog-content">
    <p><strong>Version ${majorMinorVersion} enthält wichtige Änderungen, die deine Aufmerksamkeit erfordern:</strong></p>
    <p style="margin-top: 1em; font-style: italic;">
        Diese Nachricht wird nur einmal angezeigt. Du kannst die vollständigen Änderungen jederzeit im CHANGELOG.md einsehen.
    </p>
    ${enrichedHtml}
</div>`

        // Show the notification
        showChangelogNotification(majorMinorVersion, fullContent)
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
