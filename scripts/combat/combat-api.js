import { AngriffDialog } from './dialogs/angriff.js'
import { FernkampfAngriffDialog } from './dialogs/fernkampf_angriff.js'
import { UebernatuerlichDialog } from './dialogs/uebernatuerlich.js'

/**
 * Opens a combat dialog for the given actor and item.
 *
 * Fires the cancellable `Ilaris.preCombatDialog` hook before opening.
 * If any registered handler returns `false`, the dialog is not opened and
 * `null` is returned.
 *
 * @param {Actor} actor
 * @param {Item} item
 * @param {'melee'|'ranged'|'supernatural'} type
 * @param {object} [options={}]
 * @returns {Promise<CombatDialog|null>}
 */
export async function openCombatDialog(actor, item, type, options = {}) {
    if (Hooks.call('Ilaris.preCombatDialog', actor, item, type, options) === false) return null

    let d
    if (type === 'melee') {
        d = new AngriffDialog(actor, item, options)
    } else if (type === 'ranged') {
        d = new FernkampfAngriffDialog(actor, item, options)
    } else if (type === 'supernatural') {
        d = new UebernatuerlichDialog(actor, item, options)
    } else {
        throw new Error(`[Ilaris] openCombatDialog: Unknown type "${type}"`)
    }

    await d.render(true)
    return d
}
