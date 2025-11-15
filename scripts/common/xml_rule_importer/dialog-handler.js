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
        const content = await renderTemplate(
            'systems/Ilaris/templates/importer/rule-import-dialog.hbs',
        )

        new Dialog({
            title: 'Ilaris Regeln Importieren',
            content: content,
            buttons: this._getRuleImportDialogButtons(onImport),
            default: 'import',
        }).render()
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
     * @param {HTMLElement} html - Dialog HTML content
     * @param {Function} onImport - Callback function to handle import
     * @private
     */
    static async _handleRuleImport(html, onImport) {
        const fileInput = html.querySelector('input[name="xmlFile"]')
        const file = fileInput?.files[0]

        if (!file) {
            ui.notifications.warn('Bitte wähle eine XML-Datei aus')
            return
        }

        ui.notifications.info('Importiere Regeln...')
        await onImport(file)
    }
}
