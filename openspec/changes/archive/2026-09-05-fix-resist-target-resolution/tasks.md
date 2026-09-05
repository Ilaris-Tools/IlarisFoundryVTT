## 1. Resolver Contract and Research

- [x] 1.1 Verify `foundry.utils.fromUuid` and the relevant Actor/TokenDocument behavior against the Foundry v14 API docs before changing resistance target resolution.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding the UUID compatibility fallback.
- [x] 1.3 Trace every `sendResistPrompt` caller and record which current payload fields (`target`, `targetActorUuid`, `targetActorId`) each one supplies.

## 2. Resistance Target Resolution

- [x] 2.1 Add one exported async resistance-target resolver that prefers the current structured token-aware `target` payload through `resolveTargetActorForDamage`, then falls back to `targetActorUuid`, then `targetActorId`.
- [x] 2.2 Route resist-button interaction, normal/diminished result application, and Zone traversal/movement resistance handling through the resolver without changing the newer structured payload format.
- [x] 2.3 Serialize `targetActorUuid` alongside, not instead of, the current structured target data for newly created resistance prompts.
- [x] 2.4 Retain existing missing-target warnings and safe early-return behavior when every resolution form fails.

## 3. Unit Tests

- [x] 3.1 Update `scripts/effects/pre-effects/_spec/resist-handler.spec.js` to test structured unlinked-token priority, UUID-only compatibility, actor-id fallback, and the no-target result.
- [x] 3.2 Add regression coverage that prompt click and resistance result application use the same resolver order.
- [x] 3.3 Run the focused resist-handler Jest suite and verify it fails before implementation, then passes after implementation.

## 4. E2E Tests

- [x] 4.1 Inspect E2E-026 and E2E-038 for an existing player-owned unlinked Token Actor path; add only the smallest missing visible resistance-flow regression case.
- [x] 4.2 Run `node utils/foundry-lifecycle.mjs Restart`, then run the affected E2E-026 and E2E-038 resistance cases against `ilaris-e2e-world-v14363-r1`.
- [x] 4.3 Capture and inspect the real Foundry resistance dialog/result surface; record created document IDs and cleanup in `runtime-verification.md`.

## 5. Quality and Handoff

- [x] 5.1 Run `npm install`, focused Jest, `npm test`, and `npm run lint`.
- [x] 5.2 Run `openspec validate fix-resist-target-resolution --strict`, review the scoped diff, and commit only after all validation passes.
