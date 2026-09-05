## 1. API and existing-flow preparation

- [x] 1.1 Verify against Foundry API docs (v14) the public `Actor`, `TokenDocument`, and `ChatMessage` APIs needed for target-specific ranged-defense resolution.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers; reuse a supported helper or document why none applies.
- [x] 1.3 Trace the current `UebernatuerlichDialog` success path, `Ilaris.postAngriff` defense prompt contract, unlinked-token context, and final defense outcome so the ballistic adapter has one completion per target.

## 2. Ballistic source and resolution

- [x] 2.1 Add and normalize the explicit ballistic source profile in the supernatural Item/spell-modification data path without changing unmarked spell behavior.
- [x] 2.2 Keep ballistic resolution independent of caster-to-target sight, cover, and collision checks.
- [x] 2.3 Implement the ballistic success gate in `UebernatuerlichDialog`: dispatch the existing ranged-defense contract and apply a target's Pre-Effects only when its independent outcome is undefended.
- [x] 2.4 Preserve existing target, zone, magic-resistance, energy, and non-ballistic paths; make repeated/late defense prompt delivery idempotent.
- [x] 2.5 Author the ballistic profile for every reviewed ballistic spell source, including _Ignifaxius Flammenstrahl_, without adding elemental side-effect data.
- [x] 2.6 Run `npm run pack-all`.

## 3. Unit Tests

- [x] 3.1 Extend `scripts/combat/_spec/uebernatuerlich_roll.spec.js` for ballistic marker normalization, target-by-target undefended completion without a caster token, defended no-effect behavior, and unmarked compatibility.
- [x] 3.2 Extend the relevant combat dialog/defense handler specs for existing ranged prompt routing, unlinked token context, and idempotent ballistic completion.
- [x] 3.3 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for reviewed authored ballistic source data and Ignifaxius's preserved fire damage profile.
- [x] 3.4 Run `npm install` and the focused Jest suites, then run `npm test`.

## 4. E2E Tests and runtime verification

- [x] 4.1 Use the `foundry-runtime-verification` skill to derive and record a change-specific checklist for visible cast, defense, no-effect, effect, cleanup, and screenshot evidence.
- [x] 4.2 Run `node utils/foundry-lifecycle.mjs PackAndRestart --world ilaris-e2e-world-v14363-r1 --port 30000` after source-data changes; use `Status` first when starting verification.
- [x] 4.3 Add and run a focused Playwright E2E case using the existing `e2e/shared/fixtures/foundry.ts` target/defense helpers: GM, Ignifaxius caster, owned target token, visible defense, defended result, and undefended result.
- [x] 4.4 Inspect the real dialog and chat surfaces and capture the required screenshot; verify target list, roll controls, and summaries remain visible in their existing order.
- [x] 4.5 Regression-run the affected ranged-defense, supernatural, magic-resistance, and zone E2E cases.

## 5. Final validation and handoff

- [x] 5.1 Run `npm run lint` and resolve relevant failures.
- [x] 5.2 Run `openspec validate add-ballistic-spell-resolution --strict` and resolve validation failures.
- [x] 5.3 Review the diff, stage only this change's implementation files, and commit after unit tests and runtime verification pass. (Blocked by task 4.5.)
