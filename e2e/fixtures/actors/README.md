# Actor fixtures for the e2e test world

Foundry actor exports (JSON) placed in this directory are imported into the
**Vanilla Ilaris** world when the Claude cloud test environment bootstraps
(see `.claude/foundry/README.md`). An actor is only created if no actor with
the same name exists yet, so re-runs are safe.

To add one: open your reference world, right-click the actor in the sidebar →
**Export Data**, and commit the resulting `.json` file here. Recommended
exports so the full e2e suite has its preconditions:

- `HatAlles` (held with weapons, übernatürliche Fertigkeiten, effects, inventory)
- `Testlauf-Held` (overrides the generated baseline with the real reference hero)
- `Testfall-Npc` (kreatur with Breitschwert AT 11)

Without fixtures, the bootstrap generates minimal `Testlauf-Held` and
`Testfall-Npc` actors from the compendia.
