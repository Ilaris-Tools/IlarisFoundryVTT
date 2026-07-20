## 1. Shared Fixture Extensions

- [ ] 1.1 Add `openItemSheet(page, itemName)` helper to `e2e/shared/fixtures/foundry.ts` — opens an item sheet by name from the sidebar directory via `page.evaluate`
- [ ] 1.2 Add `getActorWounds(page, actorName)` helper — returns `{wunden, erschoepfung}` from `actor.system.gesundheit`
- [ ] 1.3 Add `openPreEffectsTab(itemWindow)` helper — clicks the `[data-tab="preEffects"]` tab in an AppV2 item sheet
- [ ] 1.4 Add `getLatestChatMessage(page)` helper — returns the most recent chat message's `{flavor, content, isWhisper}` via `game.messages.contents`
- [ ] 1.5 Add `clickResistButton(page)` helper — finds and clicks `.resist-button` in the latest chat message HTML

## 2. E2E: PRE-01 — Instant Damage Pre-Effect (`e2e-025`)

- [ ] 2.1 Create directory `e2e/cases/e2e-025-pre-effect-instant-damage/`
- [ ] 2.2 Create `e2e-025-pre-effect-instant-damage.spec.ts` with Playwright test
- [ ] 2.3 Implement: Login, open HatAlles actor, open spell dialog for Ignifaxius, select self as target, roll
- [ ] 2.4 Implement: Poll for wound change via `getActorWounds()`, assert wounds increased
- [ ] 2.5 Implement: Assert chat message created with damage flavor
- [ ] 2.6 Implement: Cleanup via `restoreActorFromDefaultSnapshot` in `afterEach`

## 3. E2E: PRE-02 — Resist Flow (`e2e-026`)

- [ ] 3.1 Create directory `e2e/cases/e2e-026-pre-effect-resist-flow/`
- [ ] 3.2 Create `e2e-026-pre-effect-resist-flow.spec.ts` with Playwright test
- [ ] 3.3 Implement: Cast Ignifaxius (which has avoidTest) targeting self → wait for whisper ChatMessage
- [ ] 3.4 Implement: Assert whisper contains `.resist-button`
- [ ] 3.5 Implement: Click `.resist-button` → wait for FertigkeitDialog to open
- [ ] 3.6 Implement: Assert dialog title contains "Widerstandsprobe" and "Erschwernis" is displayed
- [ ] 3.7 Implement: Click roll button, wait for `Ilaris.postSkillRoll` hook via `page.waitForFunction`
- [ ] 3.8 Implement: Assert effect applied (wounds change) or not applied based on roll outcome
- [ ] 3.9 Implement: Cleanup via `restoreActorFromDefaultSnapshot` in `afterEach`

## 4. E2E: PRE-03 — Sheet Configuration (`e2e-027`)

- [ ] 4.1 Create directory `e2e/cases/e2e-027-pre-effect-sheet-config/`
- [ ] 4.2 Create `e2e-027-pre-effect-sheet-config.spec.ts` with Playwright test
- [ ] 4.3 Implement: Open Ignifaxius item sheet via `openItemSheet()`, navigate to pre-effects tab
- [ ] 4.4 Implement: Click "add pre-effect" button, verify new row appears
- [ ] 4.5 Implement: Enable avoidTest, click skill dropdown, assert compendium skill names appear
- [ ] 4.6 Implement: Click damage type dropdown, assert types from `damageTypes` setting appear
- [ ] 4.7 Implement: Click delete on a pre-effect row, verify row removed
- [ ] 4.8 Implement: Save item, close sheet, reopen, assert data persisted

## 5. E2E: PRE-04 — Buff ActiveEffect Creation (`e2e-028`)

- [ ] 5.1 Create directory `e2e/cases/e2e-028-pre-effect-buff-creation/`
- [ ] 5.2 Create `e2e-028-pre-effect-buff-creation.spec.ts` with Playwright test
- [ ] 5.3 Implement: Cast Axxeleratus targeting self → roll success
- [ ] 5.4 Implement: Query `actor.appliedEffects` for newly created effect via `page.evaluate`
- [ ] 5.5 Implement: Assert effect has `system.ilarisTiming.durationType: "ownerTurns"`
- [ ] 5.6 Implement: Assert effect's `changes` array contains the configured stat modifications (GS, AT, VT)
- [ ] 5.7 Implement: Assert effect duration matches `baseDuration`
- [ ] 5.8 Implement: Cleanup: delete created ActiveEffect + restore actor snapshot

## 6. Validation

- [ ] 6.1 Run `npm run lint` on all new `.spec.ts` files and fix any issues
- [ ] 6.2 Run E2E tests sequentially: `npx playwright test e2e/cases/e2e-025-pre-effect-instant-damage/ e2e/cases/e2e-026-pre-effect-resist-flow/ e2e/cases/e2e-027-pre-effect-sheet-config/ e2e/cases/e2e-028-pre-effect-buff-creation/`
- [ ] 6.3 Verify all 4 test suites pass
- [ ] 6.4 Run full E2E suite to verify no regressions: `npx playwright test`
