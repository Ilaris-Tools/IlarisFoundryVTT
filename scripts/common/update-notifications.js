import { IlarisGameSettingNames } from '../settings/configure-game-settings.model.js'

/**
 * Handles system update notifications for Ilaris
 * Shows users new features and changes when they first launch after an update
 */
export class UpdateNotifications {
    static get SYSTEM_NAME() {
        return 'Ilaris'
    }

    /**
     * Check if update notification should be shown and display it
     */
    static async checkAndShowUpdates() {
        // Get current system version
        const currentVersion = game.system.version

        // Get last seen version from settings
        const lastSeenVersion = game.settings.get(
            this.SYSTEM_NAME,
            IlarisGameSettingNames.lastSeenVersion,
        )

        // Compare versions - show notification if versions differ
        if (this.shouldShowNotification(lastSeenVersion, currentVersion)) {
            // Check if there's actually changelog content for this version
            const changelog = await this.getChangelogForVersion(currentVersion)

            // Only show dialog if there's content or it's first time
            if (changelog || lastSeenVersion === '0.0.0') {
                await this.showUpdateDialog(lastSeenVersion, currentVersion)
            } else {
                // No changelog content but version changed - just update the setting
                game.settings.set(
                    this.SYSTEM_NAME,
                    IlarisGameSettingNames.lastSeenVersion,
                    currentVersion,
                )
            }
        }
    }

    /**
     * Determine if update notification should be shown
     */
    static shouldShowNotification(lastSeenVersion, currentVersion) {
        // Always show for first-time users (default is '0.0.0')
        if (lastSeenVersion === '0.0.0') {
            return true
        }

        // Show if current version is different from last seen
        return lastSeenVersion !== currentVersion
    }

    /**
     * Show the update notification dialog
     */
    static async showUpdateDialog(lastSeenVersion, currentVersion) {
        try {
            const isFirstTime = lastSeenVersion === '0.0.0'

            // Get changelog data
            const changelog = await this.getChangelogForVersion(currentVersion)

            // Render the dialog content
            const content = await renderTemplate(
                'systems/Ilaris/templates/helper/update-notification.hbs',
                {
                    isFirstTime,
                    currentVersion,
                    changelog,
                    hasChangelog: !!changelog,
                },
            )

            // Show dialog
            new Dialog(
                {
                    title: isFirstTime ? 'Willkommen bei Ilaris!' : 'Ilaris Update',
                    content,
                    buttons: {
                        close: {
                            icon: '<i class="fas fa-check"></i>',
                            label: 'Verstanden',
                            callback: () => {},
                        },
                    },
                    default: 'close',
                    close: () => {
                        // Mark this version as seen
                        game.settings.set(
                            this.SYSTEM_NAME,
                            IlarisGameSettingNames.lastSeenVersion,
                            currentVersion,
                        )
                    },
                },
                {
                    classes: ['ilaris-update-notification'],
                    width: 700,
                    height: 800,
                },
            ).render(true)
        } catch (error) {
            console.error('Error showing update notification:', error)
        }
    }

    /**
     * Load changelog content for a specific version
     */
    static async getChangelogForVersion(version) {
        try {
            // Load the main CHANGELOG.md file
            const response = await fetch(`systems/Ilaris/CHANGELOG.md`)
            if (!response.ok) return null

            const markdownContent = await response.text()
            return this.parseVersionFromChangelog(markdownContent, version)
        } catch (error) {
            console.warn(`Could not load changelog for version ${version}:`, error)
            return null
        }
    }

    /**
     * Parse specific version from the changelog
     */
    static parseVersionFromChangelog(markdown, version) {
        const lines = markdown.split('\n')
        const versionPattern = this.getVersionPattern(version)

        let inTargetVersion = false
        let currentSection = null
        let currentContent = []
        const sections = []

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Check if we found our target version
            if (line.trim().match(versionPattern)) {
                inTargetVersion = true
                continue
            }

            // Check if we hit another version section (end of our section)
            if (inTargetVersion) {
                // Stop if we hit another ### version or #### version at same level
                const isNewMajorVersion = line.trim().match(/^###\s+v\d+\.\d+/)
                const isNewMinorVersion = line.trim().match(/^####\s+v\d+\.\d+\.\d+/)

                if (isNewMajorVersion || isNewMinorVersion) {
                    break
                }
            }

            // Process content within our target version
            if (inTargetVersion) {
                if (
                    line.trim().startsWith('#### ') &&
                    !line.trim().match(/^####\s+v\d+\.\d+\.\d+/)
                ) {
                    // This is a section header (Features, Bugfixes, etc.), not a version
                    // Save previous section
                    if (currentSection && currentContent.length > 0) {
                        sections.push({
                            title: currentSection,
                            content: currentContent.join('\n').trim(),
                        })
                    }

                    // Start new section
                    currentSection = line.trim().substring(5).trim()
                    currentContent = []
                } else if (line.trim() || currentSection) {
                    // Add line to current section (preserve original formatting)
                    if (!currentSection && line.trim().startsWith('-')) {
                        // If no section started yet but we have content, create a default one
                        currentSection = 'Änderungen'
                    }
                    if (currentSection) {
                        currentContent.push(line)
                    }
                }
            }
        }

        // Add last section
        if (currentSection && currentContent.length > 0) {
            sections.push({
                title: currentSection,
                content: currentContent.join('\n').trim(),
            })
        }

        // Return null if no content found (don't show dialog)
        return sections.length > 0 ? sections : null
    }

    /**
     * Get regex pattern for version matching
     */
    static getVersionPattern(version) {
        const parts = version.split('.')

        // For minor releases like 12.0.1, look for #### v12.0.1
        if (parts[2] && parts[2] !== '0') {
            return new RegExp(`^####\\s+v${version.replace(/\./g, '\\.')}`)
        }

        // For major releases like 12.2.0, look for ### v12.2
        const majorMinor = `${parts[0]}.${parts[1]}`
        return new RegExp(`^###\\s+v${majorMinor.replace(/\./g, '\\.')}$`)
    }
}
