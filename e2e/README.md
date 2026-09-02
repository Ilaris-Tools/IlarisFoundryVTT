# Foundry E2E tests

E2E tests run against the dedicated `ilaris-e2e-world-v14363-r1` world. Start, stop, pack, and inspect it through `node utils/foundry-lifecycle.mjs <Action>`; the helper selects that world and port `30000` by default.

Zone lifecycle tests require an active GM, the `HatAlles` caster actor, spell compendium entries for `Tlalucs Odem Pestgestank` and `Wand aus Dornen`, and an active grid Scene. Multi-user scenarios also need a caster player and a target token whose owner can receive the resistance prompt. The `useTargetSelection` setting controls whether zone automation is active.

`e2e-038-spell-zone-lifecycle` removes Ilaris zone and draft Regions, plus its temporary test tokens, before and after every test. Its setup cleanup also recovers from a run that was terminated before teardown. It asserts that zone work emits no deprecated MeasuredTemplate compatibility warning; Region placement must stay on the Foundry v14 Region API.

After changing compendium `_source/` data, run `PackAndRestart` before E2E. For code or template changes, run `Restart`; run `Status` immediately before the browser suite.
