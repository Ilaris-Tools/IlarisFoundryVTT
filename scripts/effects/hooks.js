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
import { registerZoneLifecycleHooks } from '../combat/zones/zone-lifecycle.js'
import { registerZoneAdministrationHooks } from '../combat/zones/zone-administration-hooks.js'

Hooks.once('init', () => {
    registerResistHandler()
    registerResistResolutionListener()
    registerOpposedEscapeHandler()
    registerStatusConditionLifecycle()
    registerZoneLifecycleHooks()
    registerZoneAdministrationHooks()
})
