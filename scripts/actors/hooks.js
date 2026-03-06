/**
 * Actors feature hooks.
 *
 * Sheet registration is currently handled in core/init.js.
 * TODO Phase 3: Move sheet registration here once actors are fully migrated.
 *
 * import { HeldenSheet } from './sheets/held.js'
 * import { KreaturSheet } from './sheets/kreatur.js'
 *
 * Hooks.once('init', () => {
 *     const Actors = foundry.documents.collections.Actors
 *     Actors.registerSheet('Ilaris', HeldenSheet, { types: ['character'], makeDefault: true })
 *     Actors.registerSheet('Ilaris', KreaturSheet, { types: ['npc'], makeDefault: true })
 * })
 *
 * export function actorsReady() {
 *     // Actor-specific ready logic if needed
 * }
 */
