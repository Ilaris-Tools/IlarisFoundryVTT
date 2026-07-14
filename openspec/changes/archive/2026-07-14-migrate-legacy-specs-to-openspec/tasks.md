## 1. Sync Spec Deltas to Main Specs

- [x] 1.1 Run `openspec sync specs --change migrate-legacy-specs-to-openspec` to copy all 11 capability specs from the change delta to `openspec/specs/`
- [x] 1.2 Verify `openspec/specs/` now contains 11 directories: `active-effects`, `combat`, `dice`, `weapons`, `actor-sheets`, `item-sheets`, `settings`, `importer`, `e2e-testing`, `release`, `architecture`
- [x] 1.3 Verify each spec directory contains exactly one `spec.md` file

## 2. Create Supernatural Pre-Effects Change

- [x] 2.1 Run `openspec new change "add-supernatural-pre-effects"`
- [x] 2.2 Create `proposal.md` referencing the legacy plan from `docs/_specs/2026_06_28_uebernatuerlich_pre_effect/uebernatuerlich_pre_effect_plan.md`
- [x] 2.3 Create `design.md` with the AppV2 architecture, preEffects array field, avoid/resist test system, socket routing, and Mächtige Magie/Liturgie amplification
- [x] 2.4 Create delta specs under `openspec/changes/add-supernatural-pre-effects/specs/` covering: pre-effect storage on items, resist/avoid test dialog, hit-gated effect transfer, and the `Ilaris.postResistTest` hook
- [x] 2.5 Create `tasks.md` with implementation checklist

## 3. Validate OpenSpec Structure

- [x] 3.1 Run `openspec validate` to check all specs for syntax and structural errors
- [x] 3.2 Fix any validation errors (e.g., missing scenarios, malformed headers)
- [x] 3.3 Run `openspec status` to confirm no dangling dependencies

## 4. Delete Legacy Specs

- [x] 4.1 Review `docs/_specs/` one final time to confirm all knowledge has been captured in OpenSpec specs
- [x] 4.2 Delete `docs/_specs/` directory and all contents
- [x] 4.3 Verify no references to `docs/_specs/` remain in any code, docs, or config files

## 5. Final Verification

- [x] 5.1 Run `npm test` to confirm no test regressions
- [x] 5.2 Run `npm run lint` to confirm no lint errors
- [x] 5.3 Run `openspec list --json` and confirm the change `migrate-legacy-specs-to-openspec` exists and `add-supernatural-pre-effects` exists
- [ ] 5.4 Archive this change: `openspec archive --change migrate-legacy-specs-to-openspec`
