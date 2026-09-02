/**
 * Effects feature hooks.
 * Consolidates Active Effect duration management and DOT effect handling.
 */

import './combat-turn-hooks.js'
import {
    registerResistHandler,
    registerResistResolutionListener,
} from './pre-effects/resist-handler.js'

Hooks.once('init', () => {
    registerResistHandler()
    registerResistResolutionListener()
})
