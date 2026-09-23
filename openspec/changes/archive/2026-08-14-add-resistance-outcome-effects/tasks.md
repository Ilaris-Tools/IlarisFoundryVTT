## 1. API and model preparation

- [x] 1.1 Verify against Foundry API docs (v14) the exact `ActiveEffect`, `Actor`, and `ChatMessage` embedded-document/message APIs used by the existing materialization and resistance prompt paths; record the verified `Ilaris.postSkillRoll` listener signature before changing it.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` and `foundry.utils.randomID` helper behavior, then reuse them rather than adding a custom clone/merge helper.
- [x] 1.3 Extend the shared Pre-Effect data model and sheet defaults with optional `resistanceOutcomes.success` / `.failure` replacement payloads and marker `id`/`label`, preserving legacy data with no outcome object.
- [x] 1.4 Add normalization/authoring validation for enabled outcome markers and the explicit-success-versus-legacy-`diminishedOnly` conflict without silently changing existing source data.
- [x] 1.5 Trace the current fixed and automatic supernatural skill/PW resolution, then define one concrete pre-roll cast-skill snapshot contract for the Pre-Effect, resistance, and anti-magic consumers.

## 2. Resistance outcome materialization and provenance

- [x] 2.1 Implement one tested selector that deep-clones the root Pre-Effect and replaces the complete materializable result-field set for an enabled success or failure outcome.
- [x] 2.2 Route both selected persistent outcomes through the existing common Pre-Effect materializer, retaining parent target, duration, timing, source type, spell modification, and application context.
- [x] 2.3 Extend outcome-created ActiveEffect data with `resistanceOutcome` and optional `markerId` while retaining `origin`, spell/caster metadata, component index, and application identity.
- [x] 2.4 Render a marker-only outcome as `<marker label> — <spell name>` and retain the legacy spell-name fallback for old marker data.
- [x] 2.5 Propagate equivalent spell/application/outcome provenance through condition-source ledger entries and effect-row source details without copying native status changes.
- [x] 2.6 Confirm explicit outcome materialization still follows both supernatural same-spell recast policies and cannot merge a failure payload with a success payload.
- [x] 2.7 Persist `sourceItemUuid` and exact `castSkill` on outcome ActiveEffects and condition sources, while retaining `spellUuid` and candidate `fertigkeiten` compatibility data.

## 3. Pre-Effect authoring UI

- [x] 3.1 Add reusable nested outcome-payload controls and listeners to the shared Pre-Effect sheet support, including add/remove operations for changes and Ilaris modifiers at the selected outcome path.
- [x] 3.2 Render the controls inside each existing Pre-Effect card in the agreed order: normal controls, Widerstand configuration, then optional `Bei misslungener Widerstandsprobe` and `Bei gelungener Widerstandsprobe` panels.
- [x] 3.3 Keep shared behavior separate from concrete spell/maneuver sheet placement; ensure neither shared code nor templates prepend Pre-Effects ahead of normal item content.
- [x] 3.4 Use Foundry form/theme styling only and prepare a dark-mode visual check for collapsed and expanded outcome panels.
- [x] 3.5 Add a tie-only `Fertigkeit` selector to the left-side supernatural casting controls above modifications; resolve fixed and uniquely automatic casts without adding a control, and disable roll actions until a tied selection exists.

## 4. Reviewed spell data and documentation

- [x] 4.1 Migrate _Fluch des Gewürms_ to an explicit failed-`Handlungsunfähig` marker and successful global `-4` modifier outcome, preserving its 16-Initiativephase duration and source provenance.
- [x] 4.2 Migrate _Krabbelnder Schrecken_ to the reviewed equivalent resistance-outcome data.
- [x] 4.3 Replace _Hexengalle_'s zero-valued placeholder with its two-Initiativephase failed-resistance `Handlungsunfähig` marker.
- [x] 4.4 Update `docs/develop/spell-liturgy-effect-inventory.md` and `docs/develop/pre-effect-deferred-mechanics.md` to distinguish the supported outcome/marker model from still-manual mechanics.
- [x] 4.5 Run `npm run pack-all` after all compendium `_source/` changes.

## 5. Unit tests

- [x] 5.1 Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for explicit failure/success payload selection, no-outcome fallback, legacy `diminishedOnly`, and malformed combined authoring data.
- [x] 5.2 Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for marker-only materialization, visible spell-linked name, complete flags/origin, timing, and same-spell recast behavior.
- [x] 5.3 Extend `scripts/effects/_spec/status-conditions.spec.js` and the actor effect-row tests for condition-source provenance and displayed source details.
- [x] 5.4 Extend the relevant `scripts/items/sheets/_spec/` tests for nested outcome defaults, add/remove listeners, conflict validation, and UI section order on spell and maneuver sheets.
- [x] 5.5 Extend supernatural dialog/context tests for fixed, unique-auto, and tied-auto cast-skill resolution, including its propagation through the serialized resistance payload to the created effect and condition source.

## 6. Runtime verification and E2E tests

- [x] 6.1 Create `openspec/changes/add-resistance-outcome-effects/runtime-verification.md` using the `foundry-runtime-verification` skill, including normal and dark-theme visual acceptance, exact spell/caster/provenance assertions, and user-confirmed/manual boundaries.
- [x] 6.2 Use `node utils/foundry-lifecycle.mjs PackAndRestart` after the source-data change, then verify the focused runtime checklist in `ilaris-e2e-world-v14363-r1` with an active GM, caster Token, and `e2e-player`-owned target Token.
- [x] 6.3 Add or extend a normal-flow Playwright E2E case that casts a spell configured with _Fluch des Gewürms_' reviewed outcome payload, resolves both resistance results, and verifies the visibly spell-linked effect row and provenance. Cover _Fluch des Gewürms_' exact packed source data and normal timed-effect expiry in focused source and unit tests.
- [x] 6.4 Capture normal-theme and dark-mode screenshots of the item editor, tied-skill casting selector, and actor effect row, and clean up any created effects/messages/tokens/temporary documents even if the E2E case terminates early.
- [x] 6.5 Run the focused E2E only after the manual runtime checklist confirms the feature works; if it becomes blocked, record the boundary in the runtime checklist rather than masking it with test-only document creation.

## 7. Full validation and handoff

- [x] 7.1 Run `npm install`, then `npm test` and `npm run lint` after implementation; investigate and resolve regressions attributable to this change.
- [x] 7.2 Run `openspec.cmd validate add-resistance-outcome-effects --strict` and reconcile every proposal, design, spec, task, runtime, and source-data assertion with the final implementation.
- [x] 7.3 Review the final diff, confirm the runtime-verification record states automated and remaining manual evidence, and commit only this change's files with an imperative message after required tests pass.
