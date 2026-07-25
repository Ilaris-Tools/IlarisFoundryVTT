## Why

The last release contained resolved regressions that were either not covered by E2E tests or could still pass because Playwright clicked controls a human could not reach. The suite needs user-visible interaction and rendering assertions, not only DOM/action success.

## What Changes

- Harden XML import/synchronization dialog tests with viewport and scrollability assertions.
- Add regressions for newly created and imported Held sheets rendering their Kampf tab.
- Add unit coverage for ActiveEffect ordering affecting WS and WS\*.
- Add E2E coverage for token-status ordering, row layout, and severity colour mapping.
- Add JSON compendium sync coverage for Parierwaffenkampf and the humanoid target option.
- Add default chat roll-mode coverage across dialog types.
- Explicitly exclude migration or repair of orphaned legacy token statuses.

## Capabilities

### New Capabilities

- `release-regression-e2e`: User-visible release regression coverage for dialogs, sheets, token HUDs, sync flows, and roll modes.

### Modified Capabilities

- `e2e-testing`: E2E assertions must validate reachability and visible layout for critical controls.
- `combat`: Dialog defaults and humanoid-target controls gain regression coverage.

## Impact

- Affected code: importer dialogs/CSS, Held actor initialization and sheets, token-status configuration/CSS, actor compendium sync, combat and skill dialogs, E2E cases.
- Foundry API: `DialogV2`, `Actor`, `ActiveEffect`, `Token`, `ChatMessage`, `game.settings`, and `CONFIG.ChatMessage.modes`; no new Hooks or `foundry.utils.*` utility is planned.
- API references: [DialogV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html), [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), [Token](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html).

### Testing Impact

- Unit: WS/WS\* effect ordering and default-roll-mode fallbacks.
- E2E: XML dialog scrolling, created/imported Held sheet rendering, token HUD geometry/colour, JSON sync humanoid control, and visible roll-mode defaults.
- Existing E2E-016, E2E-017, E2E-020, and dialog cases will be extended; the dedicated E2E GM/player baseline world and active scene are required.
