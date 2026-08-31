## Context

`summonCreature` already validates configured creature compendia, selects a
source in the casting dialog, and creates an unlinked Scene Token beside the
caster. This change adds the one missing lifecycle needed by _Krähenruf_ and
concrete spell data. Foundry v14 requires a world-level base Actor for an
unlinked Token's synthetic Actor, so the selected compendium source is
imported once as a managed base Actor when needed.

## Decisions

### Extend the existing payload

The additive fields live in `summonCreature`:

```js
{
  sourceUuid: '', // optional fixed creature source
  lifetime: 'permanent', // or 'timed'
  overrides: [{ path, value, amplifiedByMaechtigeMagie, maechtigBonus }]
}
```

A fixed source wins over the dialog selection and must still resolve through
the configured creature packs as a `kreatur`. `permanent` preserves the
current behavior. A `timed` summon records its Token UUID on a caster-owned
duration marker that reuses the existing owner-turn expiry flow.

### Overrides apply through an imported base Actor and Token delta

The compendium source is never modified. The runtime imports it once into the
world, marks that base Actor with its source UUID, and reuses it for later
summons of the same source. Before the base Actor's `getTokenDocument` creates
an unlinked Token source, the runtime deep-clones the compendium source and
applies configured values to the Token delta. Numeric fields receive numeric
additions; a formula receives normalized additive terms. Mächtige Magie
contributes only when configured for that override.

### Timed cleanup deletes exactly one token

The marker records the created Scene and Token UUID plus summon provenance.
On expiry it deletes that Token if it remains; a manually deleted Token is a
successful no-op. It never deletes the compendium source or managed base Actor.
The unlinked Token has its own synthetic Actor, so its overrides never modify
either source.

## Non-goals

No per-cast world Actor clone, socket route, selected-material placement,
readiness delay, combatant, action enforcement, or concentration lifecycle is
added. A reused managed world Actor base is required by Foundry v14.

## API surface

| Surface                                                     | Use                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Actor#create` / `Actor#getTokenDocument`                   | Import/reuse the compendium source as the required world base and build the unlinked Token source after overrides. |
| `Scene#createEmbeddedDocuments` / `deleteEmbeddedDocuments` | Create and expire the exact summoned Token.                                                                        |
| ActiveEffect duration lifecycle                             | Caster-owned timed marker and owner-turn expiry.                                                                   |
| `foundry.utils.deepClone`                                   | Preserve the compendium source while materializing overrides.                                                      |

## Risks and tests

- A malformed fixed source or override notifies and creates no token.
- Token creation failure does not leave a duration marker.
- Manual token deletion does not make later expiry fail.
- E2E exercises the visible Krähenschwarm creation and expiry; generic
  creature selection and item summoning remain regression cases.
