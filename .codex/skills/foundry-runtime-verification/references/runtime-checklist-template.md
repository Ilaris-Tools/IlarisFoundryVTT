# Runtime Verification: <change-name>

**Scope:** `runtime-relevant | not runtime-relevant`  
**Status:** `draft | in-progress | complete | blocked`  
**World:** `ilaris-e2e-world-v14363-r1`  
**Server:** `http://127.0.0.1:30000`  
**Source revision:** `<commit or worktree state>`

## Applicability

State why runtime verification is required. For non-runtime work, state why it is not applicable and stop here; do not add generic cases.

## Traceability

| Case  | Requirement scenario / task | Player-visible behavior         |
| ----- | --------------------------- | ------------------------------- |
| RV-01 | `<spec scenario or task>`   | `<what the player can observe>` |

## Preconditions and baseline

- **World / user / scene:**
- **Actors, items, packs, and settings:**
- **Baseline IDs/state to restore:**
- **Restart action:** `Status | Restart | PackAndRestart`, with reason:
- **Foundry v14 API / wiki references consulted:**

## Cases

### RV-01 — <short outcome>

- **Trace:** `<spec scenario(s)>`; `<task(s)>`
- **Status:** `not-run`
- **Fixture/setup:**
- **Visible player path:** numbered UI actions and controls.
- **Expected visible result:**
- **State corroboration:** chat, map, document, Active Effect, settings, duration, or reload check.
- **`page.evaluate` use:** `none` or purpose limited to setup / inspection / cleanup; explain any exception.
- **Console/page errors:**
- **Evidence:** test file/output, screenshot/video, document IDs, or manual tester report.
- **Cleanup:** exact created IDs and restored baseline.
- **Result / unverified boundary:**

## Teardown record

- **Created IDs removed:**
- **Settings, targets, documents, chat, map objects, and effects restored:**
- **Termination/failure cleanup verified:**

## Manual confirmation

| Tester   | Verified behavior           | Result           | Remaining automated or unverified boundary |
| -------- | --------------------------- | ---------------- | ------------------------------------------ |
| `<name>` | `<exact observed behavior>` | `user-confirmed` | `<boundary>`                               |

## Final assessment

- **Passed cases:**
- **Failed / blocked / not-run cases:**
- **Unexpected console diagnostics and disposition:**
- **Runtime validation conclusion:**
