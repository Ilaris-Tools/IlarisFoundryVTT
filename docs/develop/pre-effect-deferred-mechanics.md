# Deferred pre-effect mechanics

This note records spell and liturgy effects that are intentionally outside the current `preEffects` scope. It is a design boundary, not an implementation plan.

## Reviewed numeric coverage

`Tanz der Schwerter`, both `Adlerauge Luchsenohr` variants, `Innere Ruhe`, `Mondsilberzunge`, `Rahjas Wohlgefallen`, both `Psychostabilis` variants, and `Tanz des Ungehorsams` are not deferred: their complete numeric modifiers are represented in the active inventory. The remaining special modifications, target rules, and non-numeric outcomes on those Items remain manual unless separately documented.

## Marker effects such as `handlungsunfähig`

Several effects need a timed, recognizable state marker without necessarily changing an actor value. This is particularly relevant for `handlungsunfähig`.

Pre-Effects now support a stable marker id and German display label. A marker-only result creates a timed ActiveEffect even with no numeric changes and is visibly named `<Marker> — <Zauber>`. Its structured Ilaris provenance retains the source Item, caster, component, application, resistance outcome, and exact casting skill. Markers remain visible and queryable without claiming that the system automatically enforces every table rule attached to them.

## Outcome-specific resistance effects

Pre-Effects now support optional explicit success and failure payloads. `Fluch des Gewürms` and `Krabbelnder Schrecken` use them: failure marks the target as handlungsunfähig, while success applies a timed global `-4` modifier. `Hexengalle` uses the same marker model after a failed Zähigkeit resistance. Existing `diminishedOnly` source data remains supported for legacy effects.

## Other deferred mechanics

The current model also intentionally does not automate moving or persistent zones, delayed triggers, contact/crossing triggers, per-Initiativephase repetition, distance-based formulas, target-category filters, resource drains, or generic next-roll-only consumption. These are documented as deferred in the spell/liturgy effect inventory. Charged next-eligible weapon attacks are the deliberate exception: `Falkenauge Meisterschuss` and `Neun Streiche in einem` use the structured `armedCombat` pre-effect payload, which consumes one charge for every matching attack and adds damage only on a confirmed hit.

## Deferred entries and rationale

- **Aquasphaero, Archosphaero, Frigisphaero, Humosphaero, Ignisphaero, and Orcanosphaero** require a controlled moving sphere, delayed detonation, and distance-sensitive damage.
- **Auge des Limbus, Mahlstrom, and Sumpfstrudel** require a persistent area that makes distance-adjusted counter-rolls and moves targets before applying a centre outcome.
- **Kulminatio Kugelblitz** needs a delayed projectile that advances each Initiativephase before it can hit.
- **Windhose** is a moving, persistent contact zone with repeated damage, knockback, and a concentration requirement.
- **Igniplano Flächenbrand** and **Lodernder Zorn** combine area damage with Nachbrennen, terrain/fire interaction, immunity, or distance-sensitive damage.
- **Fluch der Verwirrung** and **Melodie der Verwirrung** require a Magieresistenz counter-check, which the current numeric pre-effect avoid-test flow does not initiate. **Große Verwirrung** also needs an attribute-conditional modifier rather than a global modifier.
- The nine **Mirakel** apply to the next relevant roll only; the current timed ActiveEffect model cannot consume an effect after that one roll.
- **Zerschmetternder Bannstrahl** requires target-category filtering and an Astralenergie drain in addition to its damage.

These entries remain source data for future work. They are not removed from the compendium; marker and outcome-payload support no longer blocks reviewed spells, while their other listed mechanics remain manual.
