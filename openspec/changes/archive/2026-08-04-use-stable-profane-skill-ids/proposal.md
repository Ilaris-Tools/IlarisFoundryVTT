## Why

Profane skill rolls currently carry a render-time position in `actor.profan.fertigkeiten` into `FertigkeitDialog`. Array positions are not stable actor identities, so the dialog can resolve a different skill after the prepared list changes. The resistance flow works today because it calculates the position immediately before opening the dialog, but it still shares the same fragile interface.

## What Changes

- Pass a profane embedded Item ID from the hero sheet to normal skill rolls instead of a Handlebars array index.
- Resolve profane skills by embedded Item ID for normal and resistance `FertigkeitDialog` checks.
- Keep resistance configuration name-based: resolve its configured profane skill name on the target, then pass that resolved skill's ID to the dialog.
- Preserve PW/PWT calculation, optional talent preselection, attribute checks, and all existing resistance outcomes.
- Reset declared E2E baseline setting defaults before baseline assertion so an interrupted test cleanup cannot block later test runs.
- Modify existing behavior only; there is no data migration, user-facing terminology change, or breaking pre-effect format change.

## Capabilities

### New Capabilities

- `stable-profane-skill-references`: Profane skill rolls use the owning embedded Item's stable ID throughout the sheet-to-dialog flow.

### Modified Capabilities

- `supernatural-pre-effects`: Skill-based resistance checks pass the resolved profane skill Item ID into `FertigkeitDialog` rather than an array index.
- `e2e-testing`: E2E startup restores the declared baseline setting defaults before validating the baseline.

## Impact

- [scripts/actors/templates/held/tabs/fertigkeiten.hbs](../../../scripts/actors/templates/held/tabs/fertigkeiten.hbs), [scripts/dice/wuerfel.js](../../../scripts/dice/wuerfel.js), [scripts/effects/pre-effects/resist-handler.js](../../../scripts/effects/pre-effects/resist-handler.js), and [scripts/skills/dialogs/fertigkeit.js) will adopt the ID-based dialog contract.
- The change uses the existing Foundry v14 [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) embedded Item collection and its [EmbeddedCollection#get](https://foundryvtt.com/api/classes/foundry.abstract.EmbeddedCollection.html) lookup; no new Document mutation or `foundry.utils.*` helper is required.
- Existing system hooks remain unchanged: `Ilaris.preSkillDialog`, `Ilaris.preSkillRoll`, and `Ilaris.postSkillRoll` continue to receive the same dialog and roll payloads.

## Testing Impact

- **Unit tests:** extend `scripts/skills/_spec_/skills-api.spec.js` for ID-based PW/PWT resolution and `scripts/effects/pre-effects/_spec_/resist-handler.spec.js` for forwarding the matched target skill ID and retaining talent fallback.
- **Existing tests:** update any normal-skill dialog fixtures that provide numeric `fertigkeitKey` values.
- **E2E:** extend E2E-006 (profane skill dialog) and E2E-026 (pre-effect resistance flow) to confirm normal and resistance dialogs use the correct skill and PW/PWT after the stable-ID transition.
- **E2E environment:** the existing single GM client and baseline hero are sufficient; no player client, compendium rebuild, or new shared fixture is expected.
