# Design — Fix Pre-Existing E2E Failures

## Context

Both failures are reproducible (3× runs + stash proof) and out of scope of the previous changes. Evidence:

- `e2e-003`: total `+7` vs. expected `-3`; individual maneuver lines render correctly (`-2`, `+2`, `-3`). The total comes from `CombatDialog.getSummaryContext()` → `_buildTotalModifierData(totalMod)` (`scripts/combat/dialogs/combat-dialog.js`) whose `totalMod` is built in the subclass (`angriff.js` `updateManoeverMods()` + base/status/nahkampf mods).
- `e2e-031`: `reload-world-confirm` dialog left open by `saveSettings` intercepts clicks (error context: `<dialog open id="reload-world-confirm">` blocks `.delete-damage-type`).

## Goals / Non-Goals

**Goals:**

- Fix `e2e-031` by dismissing/restoring the reload dialog (spec anchor: _Stateful E2E case restoration_ + new _Restart-dialog isolation_).
- Make `e2e-003` deterministic against polluted world state (set/restore `manuellermod`) without changing its expectation or production behavior — investigation completed (root cause = leftover `manuellermod = 10`).
- Make the full E2E suite green (118/120 → 120/120).

**Non-Goals:**

- No weakening/skipping of tests (policy).
- No changes to unrelated E2E cases.
- No compendium/baseline-world changes.

## Decisions

### D1 — e2e-031: dismiss after each settings save

Add a helper `dismissReloadDialog(page)` (or inline) that waits for `.application.dialog#reload-world-confirm`/`dialog[open].application` and clicks `button[data-action="no"]` (the cancel side), then continues. Apply it wherever the case saves settings (`saveSettings`), and keep the existing `afterEach` restoration. Pattern: reuse error-context evidence, keep the assertion flow unchanged.

### D2 — e2e-003: deterministic setup (investigation completed)

The investigation is complete; root cause and resolution:

1. **Root cause:** `getAttackSummaryContext` computes `totalMod = maneuverMod + statusMods + nahkampfMods + ilaris.value`, where `statusMods = globalermod` and `globalermod = wundabzuege + furchtabzuege + manuellermod` (`hardcodedvorteile.js`). The E2E world's `Testlauf-Held` carried `system.modifikatoren.manuellermod = 10` (leftover world state; no E2E test writes `+10` — only `e2e-004`→0, `e2e-007`→−3, `e2e-028`→`HatAlles`+2 with cleanup) → total `-3 + 10 = +7`.
2. **Resolution:** the test expectation `-3` is correct; the world was polluted. Fix = **deterministic setup** in `e2e-003`: snapshot the actor, set `system.modifikatoren.manuellermod = 0` before the modifier assertions, restore the actor afterward (pattern `e2e-017`/`e2e-028`). Verified: with `manuellermod = 0` the focused run passes (1/1, 25.8 s).
3. No production change, no expectation change, no `combat` delta.

### D3 — Verification gate

Focused `e2e-003` + `e2e-031` must pass after the fix; then the full suite once. `npm test` if production code changed. No test may be left with a weaker assertion than before.

## Risks / Trade-offs

- **[e2e-003 misclassification]** → mitigation: D2 truth-order steps; if ambiguous, keep the test and log a finding (policy: investigate before modifying either).
- **[e2e-031 dialog stability]** (dialog may appear/not appear depending on Foundry runtime) → mitigation: helper waits with a bounded timeout and tolerates absence (dismiss only if present).
- **[Full suite runtime ≈ 45 min]** → mitigation: run focused first, full suite once, async, before finalizing.

## API Surface

None assumed. If a production fix is needed in `CombatDialog`/`AngriffDialog`, verify the touched methods (`getSummaryContext`, `updateManoeverMods`, `_buildTotalModifierData`) against the Foundry v14 API docs (AppV2 rendering/`this.render({ parts })`) — no property/signature guessing.

## Testing Strategy

- Focused E2E: `e2e-003`, `e2e-031` (after each change).
- Unit: `npm test` (if `scripts/combat/dialogs/` changes; targeted `npx jest scripts/combat/_spec/angriff.spec.js` first).
- Full suite: `npm run test:e2e` once (Status/lifecycle first).
- No new tests; assertions preserved or strengthened.

## Migration Plan

None — tests and (conditional) production fix only; rollback = revert commits.

## Open Questions

1. Was `manuellermod = 10` part of the official baseline archive or introduced later into the mutable world? → For the follow-up, only relevant if a baseline rebuild is needed; the deterministic setup makes `e2e-003` robust either way. (Resolved as non-blocking.)
