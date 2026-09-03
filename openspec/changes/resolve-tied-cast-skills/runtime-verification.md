# Runtime Verification: resolve-tied-cast-skills

**Scope:** `runtime-relevant`
**Status:** `complete`
**World:** `ilaris-e2e-world-v14363-r1`
**Server:** `http://127.0.0.1:30000`
**Source revision:** uncommitted `resolve-tied-cast-skills` worktree

## Applicability

This change modifies the visible supernatural casting dialog: a tie between
several eligible automatic skills now resolves deterministically instead of
rendering a required `Fertigkeit` selector. Runtime verification is therefore
required before E2E completion.

## Traceability

| Case  | Requirement scenario / task                                                                                               | Player-visible behavior                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| RV-01 | `resistance-outcome-effects`: tied automatic skills use the alphabetically later highest-PW skill; tasks 1.1–1.2, 3.1–3.2 | A tied automatic cast shows no `Fertigkeit` selector and exposes the roll action immediately. |

## Preconditions and baseline

- **World / user / scene:** `ilaris-e2e-world-v14363-r1`, one active GM (`e2e-gm`), an active combat Scene, and the `HatAlles` caster Token.
- **Actors, items, packs, and settings:** the `HatAlles` actor's `Ignifaxius` spell is temporarily reconfigured to an `auto` cast over two tied-PW skills; the actor snapshot is restored in `afterEach`.
- **Restart action:** `Restart` completed before browser testing because the change touches JavaScript and Handlebars templates but no `_source/` compendium data.
- **Foundry v14 API / wiki references consulted:** none required — the resolver is local JavaScript data selection and template conditionals; no Foundry document, Hook, or `foundry.utils.*` API is touched.

## UI acceptance contract

- **Affected surface(s):** supernatural casting dialog left column.
- **Required order / placement:** for tied automatic skills, no `Fertigkeit` section is rendered between the armed inputs and spell modifications, and the existing roll control is immediately available.
- **Must remain visible / unchanged:** manoeuvre controls, armed inputs, spell modifications, and the existing zone/result controls keep their established top-to-bottom order.
- **Theme scope:** `both` (existing dialog styling is reused unchanged; the dark-theme dialog was inspected during the run).
- **Visual reference:** screenshot `test-results/tied-cast-skill-resolved.png` captures the resolved dialog in the dark theme.

## Cases

### RV-01 — Tied automatic skills roll immediately with the deterministic skill

- **Trace:** tied automatic skills scenario; tasks 1.1, 1.2, 3.1, 3.2.
- **Status:** `pass`
- **Fixture/setup:** locate two supernatural skills on `HatAlles` that share the highest PW, configure the `Ignifaxius` spell to `auto` over those two names, and record the actor snapshot.
- **Visible player path:** open the supernatural casting dialog for the spell.
- **Expected visible result:** no `ilaris-cast-skill` control is present, and the `angreifen` roll action is visible without any input.
- **Visual assertion:** screenshot `test-results/tied-cast-skill-resolved.png` shows the left column without a `Fertigkeit` selector and the `ZAUBER: 3W20 (MEDIAN)+26` roll panel visible in the right column.
- **State corroboration:** the resolved `castSkill` is the alphabetically later tied skill; this is unit-covered in `cast-skill-context.spec.js` and confirmed by the `Basis PW` shown in the dialog.
- **`page.evaluate` use:** fixture setup (temporary spell reconfiguration) only; the assertion path is a normal dialog open.
- **Console/page errors:** none observed during the focused run.
- **Evidence:** focused E2E-026 tied-skill case passed (46.1 s); screenshot `test-results/tied-cast-skill-resolved.png`.
- **Cleanup:** E2E-026 `afterEach` restores the `HatAlles` actor snapshot, created effects, target-selection setting, and chat log.
- **Result / unverified boundary:** passed for the tied automatic path. The full E2E-026 suite (6 tests) was later re-run and passes after the ballistic defense step was added to the resist-flow cases (Ignifaxius is a ballistic spell, so its resist flow first shows the ranged-defense prompt). This change touches only the tied-skill resolution and the removed selector.
