import { IlarisGameSettingNames } from '../settings/configure-game-settings.model.js'

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
        const templatePath = `systems/${game.system.id}/scripts/changelog/templates/breaking-changes-${version}.hbs`
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

async function fetchReleaseMetadata(version) {
    try {
        const response = await fetch(
            `systems/${game.system.id}/scripts/changelog/templates/release-metadata-major-${version.split('.')[0]}.json`,
        )
        if (!response.ok) return null
        return await response.json()
    } catch (error) {
        console.error('Ilaris | Error fetching release metadata:', error)
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
            height: 520,
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

export const MAJOR_RELEASE_TUTORIALS = [
    '@UUID[Compendium.Ilaris.kurzuebersichten.JournalEntry.kurzimport001]{Charakter-Import-Kurzübersicht}',
    '@UUID[Compendium.Ilaris.kurzuebersichten.JournalEntry.hausregel001]{Hausregel-Import-Kurzübersicht}',
]

export function buildMajorReleaseAnnouncement(majorVersion, metadata = {}) {
    const tutorials = metadata.tutorials?.length ? metadata.tutorials : MAJOR_RELEASE_TUTORIALS
    const importNotice = metadata.importRequired
        ? '<p><strong>WICHTIG: Charaktere müssen nach diesem Update neu importiert werden.</strong> Bitte nutze dafür die Charakter-Import-Kurzübersicht.</p>'
        : ''
    return `<div class="ilaris-major-release-announcement">
    <h2>Willkommen bei Ilaris v${majorVersion}</h2>
    <p><strong>Wichtige Hinweise zum Major-Release:</strong> Bitte prüfe die folgenden bestehenden Kurzübersichten, bevor du deine nächste Sitzung startest.</p>
    ${importNotice}
    <ul>${tutorials.map((tutorial) => `<li>${tutorial}</li>`).join('')}</ul>
    <p><a href="https://github.com/Ilaris-Tools/IlarisFoundryVTT/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Vollständigen Changelog öffnen</a></p>
</div>`
}

export async function announceMajorRelease(releaseMetadata = null) {
    const currentVersion = game.system?.version
    const majorVersion = currentVersion?.split('.')?.[0]
    if (!majorVersion || !game.user?.isGM || !game.world) return false

    const settingName = IlarisGameSettingNames.lastAnnouncedMajorRelease
    const lastAnnounced = game.settings.get('Ilaris', settingName)
    if (lastAnnounced === majorVersion) return false

    try {
        const metadata = releaseMetadata ?? (await fetchReleaseMetadata(`${majorVersion}.0`)) ?? {}
        const content = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            buildMajorReleaseAnnouncement(majorVersion, metadata),
            { async: true },
        )
        await ChatMessage.create({
            content,
            speaker: { alias: 'Ilaris' },
        })
        await game.settings.set('Ilaris', settingName, majorVersion)
        return true
    } catch (error) {
        console.error('Ilaris | Error announcing major release:', error)
        return false
    }
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
        const enrichedHtml = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            breakingChangesHtml,
            { async: true },
        )

        // Wrap the enriched content with additional context
        const fullContent = `<div class="ilaris-changelog-content">
    <p class="ilaris-changelog-intro"><strong>Version ${majorMinorVersion} enthält wichtige Änderungen, die deine Aufmerksamkeit erfordern:</strong></p>
    <p class="ilaris-changelog-note">
        Diese Nachricht wird nur einmal angezeigt. Du kannst die vollständigen Änderungen jederzeit im CHANGELOG.md einsehen.
    </p>
    <div class="ilaris-changelog-body">
        ${enrichedHtml}
    </div>
</div>`

        // Show the notification
        showChangelogNotification(majorMinorVersion, fullContent)
    } catch (error) {
        console.error('Ilaris | Error in changelog notification:', error)
    }
}

// Hook into the world ready event
Hooks.once('ready', async function () {
    await announceMajorRelease()
    // Small delay to ensure settings are fully loaded
    setTimeout(async () => {
        await checkAndShowChangelogNotification()
    }, 1000)
})
