/**
 * Waffe feature hooks.
 *
 * Sheet registration is currently handled in core/init.js.
 * TODO Phase 3: Move sheet registration here and import this in core/init.js:
 *
 * import { NahkampfwaffeSheet } from './sheets/nahkampfwaffe.js'
 * import { FernkampfwaffeSheet } from './sheets/fernkampfwaffe.js'
 * import { WaffeneigenschaftSheet } from './sheets/waffeneigenschaft.js'
 *
 * Hooks.once('init', () => {
 *     Items.registerSheet('Ilaris', NahkampfwaffeSheet, { types: ['nahkampfwaffe'], makeDefault: true })
 *     Items.registerSheet('Ilaris', FernkampfwaffeSheet, { types: ['fernkampfwaffe'], makeDefault: true })
 *     Items.registerSheet('Ilaris', WaffeneigenschaftSheet, { types: ['waffeneigenschaft'], makeDefault: true })
 * })
 */
