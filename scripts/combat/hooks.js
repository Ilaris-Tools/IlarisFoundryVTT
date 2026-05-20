/**
 * Combat feature hooks.
 *
 * Registers all combat-dialog hook handlers in one place so that dialog classes
 * are responsible only for roll generation and UI, while orchestration logic
 * (defense prompt dispatch, damage application) lives here.
 */

import { registerCombatDialogHandlers } from './hooks/combat_dialog_handlers.js'
import { registerSupernaturalTargetEffectHandlers } from './hooks/supernatural_target_effect_handlers.js'

// DEBUG: Uncomment the line below to enable hook logging for all combat dialog hooks.
// Remove before shipping to production.
// import './hooks-debug-example.js'

Hooks.once('init', () => {
    registerCombatDialogHandlers()
    registerSupernaturalTargetEffectHandlers()
})
