## 1. Test design and Foundry API verification

- [x] 1.1 Review existing E2E fixtures, cleanup, deterministic dice, and AppV2 click-fallback patterns.
- [x] 1.2 Verify the v14 Actor, Item, ActiveEffect, ChatMessage, Token targeting, and settings APIs used by the tests.
- [x] 1.3 Verify the `Ilaris.postSkillRoll` Hook integration and listener registration pattern.
- [x] 1.4 Check relevant `foundry.utils.*` helpers before adding test utilities.

## 2. Unit Tests

- [x] 2.1 Cover instant formula normalization, Mächtige-Magie bonuses, invalid-formula fallback, and damage-type forwarding.
- [x] 2.2 Cover ActiveEffect construction, mode mapping, flags, effective duration, empty changes, self-cast, and target handling.
- [x] 2.3 Add resist-handler unit coverage for failed, successful, diminished, and guard outcomes.
- [x] 2.4 Avoid new test-local serialization or UUID utilities after helper review.

## 3. E2E Tests

- [x] 3.1 Assert target selection synchronizes the canvas Token into `game.user.targets` in E2E-010.
- [x] 3.2 Assert exact damage wound changes and the WS-threshold feedback scenario in E2E-025.
- [x] 3.3 Assert numeric difficulty and all deterministic resist outcomes in E2E-026.
- [x] 3.4 Assert pre-effect add, change selection, persistence, reopening, and deletion in E2E-027.
- [x] 3.5 Assert every created ActiveEffect change and effective timing data in E2E-028.
- [x] 3.6 Assert deterministic healing, exact reduction, and zero-wound cap in E2E-030.
- [x] 3.7 Assert damage-type create, behavior persistence, deletion, save, and reopening in E2E-031.
- [x] 3.8 Keep single-use E2E setup local rather than promote a new shared fixture helper.
- [x] 3.9 Verify the Token targeting and settings APIs used in E2E assertions.

## 4. Release documentation

- [x] 4.1 Map healing validation to E2E-030 and configurable damage-type settings validation to E2E-031 in the major-release PR template.
- [x] 4.2 Document those automated evidence links in German while retaining manual release checks.

## 5. Verification

- [x] 5.1 Run `npm install`.
- [x] 5.2 Run focused and full Jest suites.
- [x] 5.3 Run changed E2E cases in isolation and the serial full E2E suite (55 passed).
- [x] 5.4 Run `npm run lint` and review formatting changes.
