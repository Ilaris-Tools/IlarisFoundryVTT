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
import { registerNachbrennenEffect } from './nachbrennen-effect.js'
import { registerZoneLifecycleHooks } from '../combat/zones/zone-lifecycle.js'
import { registerZoneAdministrationHooks } from '../combat/zones/zone-administration-hooks.js'
import {
    registerSummonDominationResolutionListener,
    releaseSummonedCreatureBoundResource,
} from './pre-effects/summoned-creatures.js'

// A completed token deletion needs no persistent marker: the released
// TokenDocument stays available to this hook while its Actor reservation is
// returned. Register at module load so the lifecycle is available to the
// first world document operation.
Hooks.on('deleteToken', async (tokenDocument) => {
    try {
        await releaseSummonedCreatureBoundResource(tokenDocument)
    } catch (error) {
        console.error('Ilaris | Failed to release a summoned creature resource:', error)
    }
})

Hooks.once('init', () => {
    registerResistHandler()
    registerResistResolutionListener()
    registerOpposedEscapeHandler()
    registerStatusConditionLifecycle()
    registerNachbrennenEffect()
    registerZoneLifecycleHooks()
    registerZoneAdministrationHooks()
    registerSummonDominationResolutionListener()
})
