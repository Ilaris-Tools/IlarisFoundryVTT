---
name: foundry-runtime-verification
description: Derive, execute, and record change-specific runtime verification for Ilaris Foundry VTT OpenSpec changes. Use when implementing or reviewing a change that affects Foundry behavior, UI, compendiums, settings, Active Effects, Regions/zones, combat, maneuvers, or persistent documents; and when asked to validate a change through a running Foundry world, Playwright, or manual runtime testing.
---

# Foundry Runtime Verification

Create trustworthy runtime evidence for the active OpenSpec change. Never use a generic checklist as proof that a feature works.

## 1. Establish scope and inputs

1. Identify the change. Run `openspec status --change "<change>" --json` and `openspec instructions apply --change "<change>" --json` (use `openspec.cmd` on Windows if PowerShell blocks the shim).
2. Read every `contextFiles` artifact: proposal, design, all delta specs, and tasks.
3. Classify it:
    - **Runtime-relevant:** Foundry UI, dialogs, maps, compendium data, settings, documents, effects, lifecycle, migrations, or rendered results change.
    - **Not runtime-relevant:** documentation-only, tooling-only, or a pure internal refactor with no observable Foundry result. Create a short `runtime-verification.md` stating the reason and do not invent test cases.
4. For runtime-relevant work, create or update `openspec/changes/<change>/runtime-verification.md` from [the checklist template](references/runtime-checklist-template.md). Derive each case from a spec scenario or task; include only applicable cases.
5. When the change affects a rendered UI surface, read the design's UI acceptance contract before implementation. If it is absent or ambiguous, return to exploration/proposal work; do not invent an order from shared template code.

## 2. Prepare a reliable Foundry environment

1. Before relying on a Foundry class, Hook, document field, or helper, consult the official [Foundry VTT v14 API](https://foundryvtt.com/api/v14/) and the relevant community-wiki helper guidance.
2. Use `node utils/foundry-lifecycle.mjs Status --world ilaris-e2e-world-v14363-r1 --port 30000` first.
3. After compendium `_source/` changes, use `PackAndRestart`. After code, template, or CSS changes needing a fresh client, use `Restart`. The lifecycle helper owns stopping, packing, starting, and readiness; do not ask the user to restart Foundry.
4. Record the world, relevant actors/items/scenes/settings, and baseline document state before mutating it.

Read [Foundry and Playwright workflow patterns](references/foundry-playwright-workflows.md) before authoring or changing a runtime case.

## 3. Verify the player path first

1. Drive the primary outcome through visible Playwright interaction: open the real sheet/dialog, choose the controls a player uses, place map objects, submit the roll/action, and assert the visible result.
2. Use `page.evaluate` only for isolated fixture setup, document/state inspection, cleanup, or an unavoidable low-level edge case. It MUST NOT perform the central player action or replace a visible assertion. Record any exception and its reason in the case.
3. After the UI assertion, inspect the relevant chat, map, document, Active Effect, duration, or persistence state. Treat inspection as corroboration, not a substitute for the UI flow.
4. Attach browser console/page-error collection. Investigate unexpected warnings and errors before marking a case passed; document only a specific accepted upstream compatibility warning, never a blanket exemption.
5. Use predicate-based waits and the project fixture patterns. Do not hide timing defects with fixed sleeps.
6. For a rendered UI change, inspect a screenshot of the real Foundry surface after the visible path. Verify the stated section/tab order, heading/control visibility, overflow/clipping, and any explicitly scoped theme appearance. Capture light and dark mode only when the change or acceptance contract affects theme-sensitive presentation.

## 4. Preserve isolation and evidence

1. Give every created document a recorded ID and clean up only those IDs in `finally`/teardown. Restore settings, targets, tokens, effects, chat messages, Regions/templates, and temporary items idempotently on pass, fail, or termination.
2. For stateful behavior, verify the meaningful transition(s): e.g. application and expiry, entering/leaving/re-entering a Region, replacement, deletion, reload, or duration tick as applicable.
3. Mark each case `pass`, `fail`, `blocked`, `not-run`, or `user-confirmed`. A manual check records exactly what the user confirmed and identifies unverified boundaries; it is not silently converted to automated coverage.
4. Do not mark validation or E2E tasks complete while a required runtime case is failed, blocked, or not run. Summarize evidence and remaining risk in the checklist.
5. A screenshot is evidence against the written UI contract, not a substitute for it. Record the screenshot/artifact path and any intentional deviation.

## 5. Improve the workflow from real feedback

When a user finds a runtime mismatch, add a concise, reusable rule or feature pattern to [Foundry and Playwright workflow patterns](references/foundry-playwright-workflows.md). Keep it general enough for future changes; place one-off feature facts in that change's `runtime-verification.md` instead.
