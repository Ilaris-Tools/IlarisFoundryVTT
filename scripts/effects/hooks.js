/**
 * Effects feature hooks.
 * Consolidates Active Effect duration management and DOT effect handling.
 */

import './combat-turn-hooks.js'
import {
    registerResistHandler,
    registerResistResolutionListener,
} from './pre-effects/resist-handler.js'
import { registerOpposedEscapeHandler } from './opposed-escape.js'
import { registerStatusConditionLifecycle } from './status-conditions.js'

Hooks.once('init', () => {
    registerResistHandler()
    registerResistResolutionListener()
    registerOpposedEscapeHandler()
    registerStatusConditionLifecycle()
})
