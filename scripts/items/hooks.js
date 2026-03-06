/**
 * Items feature hooks.
 *
 * Sheet registration is currently handled in core/init.js.
 * TODO Phase 3: Move sheet registration here once all items are migrated.
 *
 * import { ItemSheet } from './sheets/item.js'
 * import { RuestungSheet } from './sheets/ruestung.js'
 * import { FertigkeitSheet } from './sheets/fertigkeit.js'
 * import { TalentSheet } from './sheets/talent.js'
 * import { ManoeverSheet } from './sheets/manoever.js'
 * import { VorteilSheet } from './sheets/vorteil.js'
 * import { EigenheitSheet } from './sheets/eigenheit.js'
 * import { EigenschaftSheet } from './sheets/eigenschaft.js'
 * import { GegenstandSheet } from './sheets/gegenstand.js'
 * import { FreieFertigkeitSheet } from './sheets/freie_fertigkeit.js'
 * import { FreiesTalentSheet } from './sheets/freies_talent.js'
 * import { InfoSheet } from './sheets/info.js'
 * import { AbgeleiteterWertSheet } from './sheets/abgeleiteter-wert.js'
 * import { AngriffSheet } from './sheets/angriff.js'
 * import { EffectItemSheet } from './sheets/effect-item.js'
 * import { UebernatuerlichFertigkeitSheet } from './sheets/uebernatuerlich_fertigkeit.js'
 * import { UebernatuerlichTalentSheet } from './sheets/uebernatuerlich_talent.js'
 *
 * Hooks.once('init', () => {
 *     const Items = foundry.documents.collections.Items
 *     Items.registerSheet('Ilaris', RuestungSheet, { types: ['ruestung'], makeDefault: true })
 *     Items.registerSheet('Ilaris', FertigkeitSheet, { types: ['fertigkeit'], makeDefault: true })
 *     // ... etc.
 * })
 */
