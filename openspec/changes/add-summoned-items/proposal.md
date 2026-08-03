## Why

Several spells and liturgies create physical objects for a recipient to use, but
the current pre-effect processor can only apply damage or create ActiveEffects.
GMs must therefore create, configure, select, and later remove the resulting
Items manually, which loses the spell's duration, casting context, and
Mächtige-Magie behavior.

## What Changes

- Add a generic `summonItem` pre-effect operation for Zauber, Liturgien, and
  Anrufungen. On a successful cast it creates an independent Actor-owned clone
  of the configured compendium Item on every selected target.
- Reuse the configured `waffenPacks` catalog as the source catalog for the
  summon-item dropdown. The stored source is a stable Item UUID, not a name.
- Mark summoned weapon clones as `hauptwaffe`; the most recently summoned
  weapon becomes the selected main weapon for its recipient.
- Track every summoned copy separately and retain multiple copies in both
  `ilaris` and `foundry` supernatural-effect stacking modes.
- Use existing owner-turn timing only for duration expiry. The expiry marker
  removes the particular linked summoned Item, without affecting other copies.
- Support applying Mächtige Magie values to summoned Item data, including W3
  and W20 dice terms in the Ilaris modifier-value parser.
- Configure the reviewed summoning spells and liturgies after their source
  Items have been manually authored.
- Document two explicit prerequisites that are out of scope for this change:
  generic after-roll Item expiry for one-use summons, and manual authoring of
  the reviewed summoned Item source data. Do not start implementation until
  both prerequisites are complete.

This is an additive change to pre-effect behavior and compendium data. It does
not remove existing functionality. The existing Foundry stacking behavior is
intentionally unchanged for ordinary persistent pre-effects; summoned Items
always keep independent copies.

## Capabilities

### New Capabilities

- `summoned-items`: Generic, target-recipient Item summoning with owner-turn
  expiry, weapon main-hand selection, independent copies, and explicit
  one-use-expiry prerequisite.
- `summoned-item-source-data`: Reviewed compendium source Items and
  summon-item pre-effect configurations for the audited spell/liturgy set.

### Modified Capabilities

- `supernatural-pre-effects`: Extend the pre-effect schema and successful-cast
  processing with the `summonItem` operation.
- `rule-aware-active-effect-modifiers`: Expand additive dice-formula parsing
  from W6-only terms to W3 and W20 terms.

## Impact

- `scripts/effects/pre-effects/pre-effects-processor.js` gains the summon-item
  creation path and owner-turn cleanup integration.
- `scripts/effects/combat-turn-hooks.js` cleans up a linked summoned Item when
  its timer marker expires.
- `scripts/items/sheets/uebernatuerlich-talent.js` and
  `scripts/items/templates/pre-effects.hbs` expose source selection from
  `waffenPacks` and summon-item authoring fields.
- `scripts/effects/utils/ilaris-modifier-resolver.js` accepts W3 and W20 terms
  in linear additive formulas.
- `comp_packs/**/_source/` gains manually authored Item sources and updates
  to the corresponding supernatural source Items, followed by `npm run pack-all`.

The relevant Foundry V14 APIs are:

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
  `createEmbeddedDocuments`, `deleteEmbeddedDocuments`, and
  `allApplicableEffects` for target-owned clones, cleanup, and transferred
  effects.
- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html)
  `toObject` and `transferredEffects` for copying source data and allowing
  Item-owned effects to apply to the recipient.
- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
  for the existing duration marker that links to a specific summoned Item.
- [combatTurn](https://foundryvtt.com/api/v14/functions/hookEvents.combatTurn.html),
  [combatRound](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html),
  and [updateDocument](https://foundryvtt.com/api/v14/functions/hookEvents.updateDocument.html)
  as the existing owner-turn expiry integration points. Their exact signatures
  must be re-verified before implementation.
- `foundry.utils.deepClone` to copy source Item data safely before Actor-owned
  creation; the [Foundry VTT community wiki](https://foundryvtt.wiki/en/development/api/helpers)
  must be checked for applicable helpers before implementation.

The one-use removal requirement needs a generic item-aware after-roll event
that identifies the Actor and Item used. Although the system currently emits
the custom `Ilaris.postAngriff` event, defining or extending that generic
after-roll expiry capability is a prerequisite outside this change's scope.

## Manual Prerequisites

The following source Items were identified by the audit and must be manually
created and reviewed before `/opsx:apply` begins. No generated values or
inferred rules are acceptable for this data.

| Source Item                | Summoning source                          | Manual review required                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Phexens Wurfstern          | Phexens Sternenwurf                       | Weapon statistics, +4 FK, 2W20 TP, one-use behavior, and +1W20 per Mächtige Magie QS |
| Armalion                   | Segen der Heiligen Ardare                 | Weapon statistics, 2W20+10 TP, WM +2, Wendig, and 16-owner-turn duration             |
| Lagorax' Hammer            | Largorax' Hammer                          | Weapon/tool statistics, 2W20+10 TP, crafting behavior, and one-use behavior          |
| Firuns Ring                | Firuns Einsicht                           | Item type and behavior representation                                                |
| Heiliger Trichter Hesindes | Ingalfs Alchemie                          | Item type and alchemical-analysis behavior representation                            |
| Phexens Meisterschlüssel   | Phexens Meisterschlüssel                  | Item type and lock-opening behavior representation                                   |
| Heiliger Kessel            | Speisung der Bedürftigen, Heiliger Kessel | Item type, supply behavior, and disappearance condition                              |
| Schimmernder Schild        | Fortifex arkane Wand, Schimmernder Schild | Item type, Holzschild baseline, and magical invulnerability behavior                 |

Transformations, enchantments of an existing Item, zones, and summoned
creatures are not candidates for this change. They remain outside the
summon-item contract unless separately proposed.

## Testing Impact

- Add unit coverage in `scripts/effects/pre-effects/_spec/` for source lookup,
  target-owned clone creation, independent copy identities, main-weapon
  selection, owner-turn cleanup, and no replacement in either stacking mode.
- Extend `scripts/effects/utils/_spec/ilaris-modifier-resolver.spec.js` with
  valid and invalid W3/W20 additive formula cases.
- Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` with
  the reviewed source Item UUIDs and summon configurations once the manual
  source data exists.
- Add an E2E summon-item flow based on the pre-effect suite: a GM and the
  existing `HatAlles` world actor are sufficient; no additional player is
  needed. Cover target selection, inventory creation, Hauptwaffe selection,
  owner-turn expiry, and multiple copies under both stacking settings.
- Regression-check E2E-027 (pre-effect sheet configuration) and E2E-028
  (persistent pre-effect creation). Shared Item/inventory snapshot helpers may
  be promoted to `e2e/shared/fixtures/foundry.ts` if the new flow needs them.
