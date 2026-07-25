## 1. Research and regression contracts

- [ ] 1.1 Verify relevant Foundry V14 APIs and foundryvtt.wiki helpers for actor effects, token HUDs, dialogs, and settings.
- [ ] 1.2 Record legacy/orphaned token-status migration as explicitly unsupported.

## 2. Unit Tests

- [ ] 2.1 Add Held WS/WS\* ActiveEffect ordering regression tests in the actor spec suite.
- [ ] 2.2 Add roll-mode fallback unit coverage where dialog controllers lack it.

## 3. E2E Tests

- [ ] 3.1 Extend E2E-016 with import/sync dialog scrolling and generated Held Kampf rendering assertions.
- [ ] 3.2 Add JSON compendium sync → Parierwaffenkampf → humanoid control coverage.
- [ ] 3.3 Add token-status HUD order, row-layout, and colour coverage.
- [ ] 3.4 Add chat default roll-mode coverage across skill and combat dialogs.

## 4. Validation

- [ ] 4.1 Run focused Jest tests, affected E2E cases, npm test, npm run lint, and the full E2E suite.
