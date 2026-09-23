## 1. Integration preparation

- [x] 1.1 Verify the existing caster-turn effect-expiry seam and documented Foundry v14 TokenDocument deletion APIs.
- [x] 1.2 Verify `foundry.utils.deepClone` and object-path helpers against the community wiki before applying source overrides.

## 2. Timed creature-summon runtime

- [x] 2.1 Extend `summonCreature` with an optional configured source UUID, `lifetime` (`timed` or `permanent`), a managed reusable compendium-source import, and field-aware Token overrides.
- [x] 2.2 Apply numeric overrides as numbers and formula overrides as normalized additive formulas, including Mächtige-Magie increments.
- [x] 2.3 Create a caster-owned duration marker for timed creature Tokens and remove only the recorded Token when it expires; tolerate manual deletion.
- [x] 2.4 Keep permanent Skelettarius-style creature Tokens unchanged and retain existing generic selection and placement behavior.

## 3. Authoring and compendium data

- [x] 3.1 Extend the shared and structured pre-effect authoring controls for fixed source, lifetime, and overrides without altering Item summons.
- [x] 3.2 Add the reviewed Krähenschwarm source to the creature compendium.
- [x] 3.3 Configure Krähenruf with its fixed Krähenschwarm source, 16-phase lifetime, and WS/AT/TP Mächtige-Magie overrides; retain Skelettarius as a permanent `untot` selection.
- [x] 3.4 Run `npm run pack-all` after source-data changes.

## 4. Tests and runtime evidence

- [x] 4.1 Add focused unit coverage for fixed-source validation, managed base-Actor import/reuse, overrides, timed cleanup, manual deletion tolerance, permanent retention, and existing Item-summon regression.
- [x] 4.2 Extend authoring and dialog tests for the new creature-summon configuration.
- [x] 4.3 Use the `foundry-runtime-verification` skill and add E2E coverage for Krähenruf lifecycle plus generic creature/item-summoning regression.

## 5. Validation and handoff

- [x] 5.1 Run `npm install`, focused tests, `npm test`, and the scoped lint validation.
- [x] 5.2 Run `openspec validate add-summoned-actor-pre-effect --strict`.
- [x] 5.3 Review the final diff, preserve unrelated changes, and commit only this change after required E2E tests pass.
