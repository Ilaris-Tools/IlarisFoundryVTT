## 1. API and Existing-Flow Verification

- [x] 1.1 Verify the Foundry VTT v14 status-effect picker API, its exact lifecycle hooks, `ActiveEffect`, and Actor embedded-document method signatures before choosing the manual-source interception point.
- [x] 1.2 Check foundryvtt.wiki for v14 status-effect, `foundry.utils.deepClone`, `mergeObject`, `randomID`, and embedded ActiveEffect patterns.
- [x] 1.3 Trace the existing `CONFIG.statusEffects`, actor-header status rendering, and owner-turn timing flow, including legacy effects that have a `statuses` Set but no Ilaris condition data.

## 2. Condition Data and Service

- [x] 2.1 Add a bounded Ilaris ActiveEffect condition-data schema containing status ID and source ledger entries with stable IDs, source type, provenance, and optional source timing.
- [x] 2.2 Implement a condition service that deep-clones a configured status template, creates or updates exactly one status-bearing effect per actor/status ID, and applies native template changes once.
- [x] 2.3 Implement source add/remove and legacy status-effect normalization, deleting the embedded effect only when its final source is removed.
- [x] 2.4 Verify ActiveEffect and Actor update/create/delete operations against Foundry API docs (v14).
- [x] 2.5 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before finalizing data normalization and document update utilities.

## 3. Manual Status and Timing Integration

- [x] 3.1 Connect the documented status-picker operation to manual condition sources: enable adds a manual source, disable removes a manual source, and automated-only conditions remain protected with German feedback.
- [x] 3.2 Show condition-source details in the actor effect/status presentation so a remaining automated source is visible after manual removal.
- [x] 3.3 Extend the existing GM-only owner-turn lifecycle to expire individual timed sources and retain a condition while another source remains.
- [x] 3.4 Verify the status-picker hook signature and combat timing hooks against Foundry API docs (v14).
- [x] 3.5 Check foundryvtt.wiki for status-picker, Hook, and embedded-document interaction patterns.

## 4. Maneuver Condition Adoption

- [x] 4.1 Add an optional bounded canonical-condition reference to the shared pre-effect schema and authoring UI.
- [x] 4.2 Route condition-bearing pre-effects through the condition service while retaining existing non-condition pre-effect behavior.
- [x] 4.3 Replace Niederwerfen and Umreißen's copied native Liegend changes with Position4 condition references and preserve their resistance behavior.
- [x] 4.4 Verify the shared pre-effect document/model update behavior against Foundry API docs (v14).
- [x] 4.5 Check foundryvtt.wiki for relevant cloning/merging helpers used by pre-effect materialization.
- [x] 4.6 Run `npm run pack-all` after modifying maneuver `_source/` data.

## 5. Unit Tests

- [x] 5.1 Create condition-service unit coverage for first-source creation, source merging, duplicate prevention, final-source deletion, and legacy status normalization.
- [x] 5.2 Extend `scripts/effects/_spec/combat-turn-hooks.spec.js` for independent condition-source owner-turn expiry and retained-effect behavior.
- [x] 5.3 Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for Position4 condition requests and unchanged ordinary pre-effects.
- [x] 5.4 Add picker-routing/effect-row tests for manual source add/remove, automated-only protection, and localized remaining-source feedback.
- [x] 5.5 Add compendium assertions that Niederwerfen and Umreißen request Position4 without duplicating Position4 native changes.
- [x] 5.6 Run `npm install` and `npm test`.

## 6. E2E Tests

- [x] 6.1 Add a Foundry E2E scenario: a failed Niederwerfen resistance creates one visible Position4/Liegend status with one mechanical penalty set.
- [x] 6.2 Add a Foundry E2E scenario: manual Liegend remains after an automated source is removed or expires, and vice versa.
- [x] 6.3 Add a Foundry E2E scenario: the status picker cannot silently remove an automated-only Liegend condition and communicates the remaining source.
- [x] 6.4 Run the E2E scenarios in the dedicated baseline world with a GM and controllable source/target actors; extract a status-picker helper to `e2e/shared/` only if reused.

## 7. Final Validation

- [x] 7.1 Run `npm test`.
- [x] 7.2 Run `npm run lint`.
- [x] 7.3 Run `npm run pack-all` and reload Foundry after the maneuver data update.
- [x] 7.4 Run `openspec validate add-status-condition-lifecycle --strict`.
- [x] 7.5 Verify manual and automated Liegend source interactions in the configured Foundry world.
