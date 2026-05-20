import { FertigkeitDialog } from './dialogs/fertigkeit.js'

/**
 * Opens the unified skill dialog for skills, attributes, and free checks.
 *
 * Fires the cancellable `Ilaris.preSkillDialog` hook before opening.
 * If any registered handler returns `false`, the dialog is not opened and
 * `null` is returned.
 *
 * @param {Actor} actor
 * @param {object} options
 * @returns {Promise<FertigkeitDialog|null>}
 */
export async function openSkillDialog(actor, options = {}) {
    if (Hooks.call('Ilaris.preSkillDialog', actor, options) === false) {
        return null
    }

    const dialog = new FertigkeitDialog(actor, options)
    await dialog.render(true)
    return dialog
}
