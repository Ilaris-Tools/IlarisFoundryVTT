/**
 * Combat feature hooks.
 *
 * TODO Phase 3: Move combat-related hooks here from core/init.js.
 *
 * import { registerDefenseButtonHook } from './dialogs/defense_button_hook.js'
 * import { setupIlarisSocket } from './dialogs/combat_dialog.js'
 *
 * export function combatReady() {
 *     registerDefenseButtonHook()
 *     setupIlarisSocket()
 * }
 *
 * Hooks.on('renderChatMessageHTML', (message, html, data) => {
 *     // Defense prompt rendering (currently in core/init.js)
 * })
 */

// DEBUG: Uncomment the line below to enable hook logging for all combat dialog hooks.
// Remove before shipping to production.
import './hooks-debug-example.js'
