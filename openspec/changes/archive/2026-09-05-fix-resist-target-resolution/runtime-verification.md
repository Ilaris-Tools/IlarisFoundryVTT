# Runtime Verification — fix-resist-target-resolution

## Preconditions

- Change base: `feature/wound-effects` at `ceadae3f`.
- Target world: `ilaris-e2e-world-v14363-r1` on port `30000`.
- No compendium source data is changed; packing is not required.

## Research and payload trace

- Foundry v14 documents `foundry.utils.fromUuid(uuid)` as asynchronous document resolution. A resolved `Actor` is used only after the structured token-aware target path cannot resolve.
- Foundry v14 `TokenDocument.actor` provides the synthetic Actor for an unlinked Token; the existing `resolveTargetActorForDamage` helper remains the first resolver.
- The community Foundry helper guide was checked; no helper replaces token-aware target resolution or `fromUuid` for this compatibility fallback.

| Prompt creator                                                                        | `target`                                     | `targetActorUuid`                                            | `targetActorId`                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `sendResistPromptForEffect` in `scripts/effects/pre-effects/pre-effects-processor.js` | Structured `{ actorId, tokenId, actorLink }` | Not supplied before this change; added by `sendResistPrompt` | Supplied                                |
| `sendResistPrompt` in `scripts/effects/pre-effects/resist-handler.js`                 | Preserved unchanged                          | Adds resolved target Actor UUID                              | Rewrites from the resolved target Actor |

## Runtime result

- `node utils\\foundry-lifecycle.mjs Restart --world ilaris-e2e-world-v14363-r1 --port 30000` started a fresh v14 test world.
- Focused E2E-026 case, **Resist whisper is sent and FertigkeitDialog opens with correct parameters**: passed. The inspected real dialog showed `Widerstandsprobe: Konstitution (gegen Ignifaxius Flammenstrahl)` with `Erschwernis: 12`.
- E2E-038 case, **sends one resistance prompt to the player-owned target on creation and re-entry**: passed after the new unlinked-token click/result step. The inspected screenshot is `test-results/unlinked-zone-resistance-dialog.png`; it shows `Widerstandsprobe: Konstitution (gegen Wand aus Dornen)` with `Erschwernis: 12`.
- The E2E-038 case records its temporary Region id (`result.regionId`), unlinked Token id (`result.tokenId`), and synthetic Actor effect baseline (`result.effectIds`). Its suite `afterEach` removes all `flags.Ilaris.e2eZone` Regions and Tokens and clears the test chat log; the passing result confirms that cleanup completed.
- The player-click result creates an effect only on the unlinked Token Actor, verified by comparing its post-result effect ids to `result.effectIds`. The world Actor is not used for that assertion.

## Runtime diagnostics

- E2E-038 captured no measured-template deprecation diagnostics through its existing console listener.
- The targeted E2E result markers reported `status: passed` with no failed tests.
