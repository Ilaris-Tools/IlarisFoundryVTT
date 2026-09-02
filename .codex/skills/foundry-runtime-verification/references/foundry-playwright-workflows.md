# Foundry and Playwright workflow patterns

## Lifecycle

- Start with `node utils/foundry-lifecycle.mjs Status --world ilaris-e2e-world-v14363-r1 --port 30000`.
- Use `PackAndRestart` after `_source/` compendium changes; use `Restart` after code/template/CSS changes needing a fresh client. The helper manages the Foundry CLI, port, lock, and readiness.
- Do not manually start or stop Foundry while the helper owns the test server.

## UI-first Playwright

- Reuse the shared Foundry fixture and find at least two nearby E2E cases before adding a new case.
- Make the player action visible: actor/item sheet → action dialog → target/option selection → action/roll → rendered result. Assert control visibility before activation.
- Use `page.evaluate` only for narrowly-scoped fixtures, inspection, or teardown. It may not cast, roll, place, submit, or otherwise replace the user action under test.
- Use predicate-based waits (`expect(...).toBeVisible`, `waitForFunction`, `waitForSelector`), not fixed waits. Retain the established AppV2 click fallback only when normal clicking demonstrably fails.
- Capture browser `console` warnings/errors and `pageerror`; fail or explicitly explain each unexpected diagnostic.

## Visual UI acceptance

- Before implementation, turn the approved OpenSpec UI acceptance contract into assertions: identify the concrete Foundry surface, the intended top-to-bottom part/section order or tab placement, and the controls/headings that must remain visible. If this is missing, return to exploration or proposal work instead of guessing from a shared template.
- Open the real surface through the player path, take a screenshot after it finishes rendering, and inspect it against the contract. Check section order, hierarchy, clipping/overflow, and accidental duplicate or displaced content. Keep the screenshot as test evidence or an attachment/output artifact.
- For a reused AppV2 base, mixin, or template partial, verify both the original and the newly sharing sheet. Reuse data preparation and event listeners, but let each concrete sheet own its template part order; a shared base must not implicitly prepend or append a section globally unless that is explicitly the contract.
- Test light and dark mode when a CSS, color, contrast, or theme-sensitive surface changed, or when the acceptance contract calls for it. Otherwise record why one theme is sufficient.
- Use stable structural locators to assert order where possible (for example, compare element indexes within the sheet); treat screenshot inspection as the final visual safeguard, not the only assertion.

## State and cleanup

- Snapshot the precise world state that a case changes. Track document IDs created by the case; never delete by broad name, type, pack, or collection scans.
- Use `try`/`finally` for cleanup. Restore settings, user targets, tokens, Regions/templates, Active Effects, temporary items, and chat messages on success, failure, and interrupted execution.
- Assert exact message/document deltas where appropriate rather than loose existence checks.

## Feature selection guide

| Change affects    | Include when applicable                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialogs or sheets | Visible controls, stated section/tab order, valid and invalid state, rerender/reopen behavior, rendered result, screenshot-based visual review                      |
| Compendiums       | Pack/restart, item discoverability, sheet rendering, player use of authored data                                                                                    |
| Active Effects    | Applied effect, sheet/chat visibility, modifiers, stacking/replacement, duration/charge expiry, removal                                                             |
| Regions or zones  | Visible placement preview, placement confirmation, initial occupant, enter/leave/re-entry, concurrent Regions, expiry/deletion, reload, exact Region/effect cleanup |
| Combat/maneuvers  | Attacker and defender target assignment, resistance/result path, effect/charge state, chat result                                                                   |
| Settings          | Default and non-default behavior, user-visible control, reset/restoration                                                                                           |

## Manual verification

- A user report is valid runtime evidence only for the exact flow they observed. Record it as `user-confirmed` and list untested variants.
- Convert repeated, general lessons from feedback into this reference. Keep one-off spell, scene, token, or data details in the active change checklist.
