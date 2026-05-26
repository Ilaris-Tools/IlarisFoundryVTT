/**
 * Dialog Handler for XML Rule Import
 * Manages the UI for importing XML rules
 */
export class DialogHandler {
    /**
     * Show the rule import dialog
     * @param {Function} onImport - Callback function to handle import with (file) parameter
     */
    static async showRuleImportDialog(onImport) {
        const content = await foundry.applications.handlebars.renderTemplate(
            'systems/Ilaris/scripts/importer/templates/rule-import-dialog.hbs',
        )

        new Dialog({
            title: 'Ilaris Regeln Importieren',
            content: content,
            buttons: this._getRuleImportDialogButtons(onImport),
            default: 'import',
        }).render(true)
    }

    /**
     * Get button configuration for rule import dialog
     * @param {Function} onImport - Callback function to handle import
     * @returns {Object} Dialog button configuration
     * @private
     */
    static _getRuleImportDialogButtons(onImport) {
        return {
            import: {
                icon: '<i class="fas fa-file-import"></i>',
                label: 'Importieren',
                callback: async (html) => {
                    await this._handleRuleImport(html, onImport)
                },
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Abbrechen',
            },
        }
    }

    /**
     * Handle the rule import process from dialog callback
     * @param {jQuery} html - Dialog HTML content (jQuery object)
     * @param {Function} onImport - Callback function to handle import
     * @private
     */
    static async _handleRuleImport(html, onImport) {
        const fileInput = html.find('input[name="xmlFile"]')[0]
        const file = fileInput?.files[0]

        if (!file) {
            ui.notifications.warn('Bitte wähle eine XML-Datei aus')
            return
        }

        DialogHandler._showProgress('Importiere Regeln\u2026')
        try {
            await onImport(file)
        } finally {
            DialogHandler._hideProgress()
        }
    }

    /**
     * Show a full-screen loading overlay with a spinner and message.
     * Removes any existing overlay first to avoid duplicates.
     * @param {string} message - Message displayed below the spinner
     */
    static _showProgress(message) {
        DialogHandler._hideProgress()
        const overlay = document.createElement('div')
        overlay.id = 'ilaris-import-progress'
        overlay.innerHTML = `
            <div class="ilaris-import-progress-content">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${message}</span>
            </div>
        `
        document.body.appendChild(overlay)
    }

    /** Remove the loading overlay if present. */
    static _hideProgress() {
        document.getElementById('ilaris-import-progress')?.remove()
    }
}
