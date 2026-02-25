/**
 * Effects feature hooks.
 * Consolidates Active Effect duration management and DOT effect handling.
 *
 * TODO Phase 3: Remove legacy imports from core/hooks.js and use this instead:
 * import '../effects/hooks.js'
 *
 * At that point, also fix the import path in dot-effects.js:
 * - Change: import { IlarisActiveEffect } from '../documents/active-effect.js'
 * - To:     import { IlarisActiveEffect } from '../../core/documents/active-effect.js'
 */

import './active-effects.js'
import './dot-effects.js'
