# Deferred pre-effect mechanics

This note records spell and liturgy effects that are intentionally outside the current `preEffects` scope. It is a design boundary, not an implementation plan.

## Reviewed numeric coverage

`Tanz der Schwerter`, both `Adlerauge Luchsenohr` variants, `Innere Ruhe`, `Mondsilberzunge`, `Rahjas Wohlgefallen`, both `Psychostabilis` variants, and `Tanz des Ungehorsams` are not deferred: their complete numeric modifiers are represented in the active inventory. The remaining special modifications, target rules, and non-numeric outcomes on those Items remain manual unless separately documented.

## Marker effects such as `handlungsunfähig`

Several effects need a timed, recognizable state marker without necessarily changing an actor value. This is particularly relevant for `handlungsunfähig`.

The current processor only creates an ActiveEffect when it has one or more data changes, and names that effect after the source spell. It has no separate marker identifier or display label. For heroes, NPCs, and creatures this must not be emulated by writing an arbitrary `system.*` path: the available actor schemas differ.

### Future design direction (out of scope)

If marker effects are implemented later, the preferred model is an explicit marker on a pre-effect, for example a stable `markerId` plus a German display label. The processor would then create a timed ActiveEffect with that label and store the marker in an Ilaris flag, even when the effect has no numeric changes.

This would make a marker visible and queryable without claiming that the system automatically enforces every table rule attached to it.

## Outcome-specific resistance effects

Some effects need different results for a passed and failed resistance check. `Fluch des Gewürms` is the current example: failure marks the target as handlungsunfähig; success applies a timed global -4 modifier.

The current `diminishedOnly` mechanism can replace change values after a successful resistance, but it cannot assign separate marker and modifier payloads to the two outcomes. A future extension could define explicit success and failure effect payloads.

## Other deferred mechanics

The current model also intentionally does not automate moving or persistent zones, delayed triggers, contact/crossing triggers, per-Initiativephase repetition, distance-based formulas, target-category filters, resource drains, or next-roll-only consumption. These are documented as deferred in the spell/liturgy effect inventory.

## Deferred entries and rationale

- **Aquasphaero, Archosphaero, Frigisphaero, Humosphaero, Ignisphaero, and Orcanosphaero** require a controlled moving sphere, delayed detonation, and distance-sensitive damage.
- **Auge des Limbus, Mahlstrom, and Sumpfstrudel** require a persistent area that makes distance-adjusted counter-rolls and moves targets before applying a centre outcome.
- **Kulminatio Kugelblitz** needs a delayed projectile that advances each Initiativephase before it can hit.
- **Windhose** is a moving, persistent contact zone with repeated damage, knockback, and a concentration requirement.
- **Igniplano Flächenbrand** and **Lodernder Zorn** combine area damage with Nachbrennen, terrain/fire interaction, immunity, or distance-sensitive damage.
- **Fluch der Verwirrung** and **Melodie der Verwirrung** require a Magieresistenz counter-check, which the current numeric pre-effect avoid-test flow does not initiate. **Große Verwirrung** also needs an attribute-conditional modifier rather than a global modifier.
- The nine **Mirakel** apply to the next relevant roll only; the current timed ActiveEffect model cannot consume an effect after that one roll.
- **Zerschmetternder Bannstrahl** requires target-category filtering and an Astralenergie drain in addition to its damage.

These entries remain source data for future work. They are not removed from the compendium and this change does not introduce the marker, outcome-payload, zone, or next-roll architecture needed to automate them.
