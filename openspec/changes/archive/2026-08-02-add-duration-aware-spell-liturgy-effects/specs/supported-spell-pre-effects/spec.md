## ADDED Requirements

### Requirement: Selected numeric spell and liturgy effects receive complete coverage

The nine reviewed source Items in seven effect families SHALL receive one complete non-instant pre-effect each. Their numeric changes SHALL be limited to mechanics already supported by native ActiveEffects or semantic Ilaris modifiers; no partial, contact, zone, or ambiguous mechanics shall be implied.

Each selected source Item's stated Mächtige Magie/Liturgie increase SHALL be represented through the existing `amplifiedByMaechtigeMagie` and `maechtigBonus: "+2"` fields on its affected change or Ilaris modifier.

#### Scenario: Tanz der Schwerter applies its complete combat modifier

- **WHEN** Tanz der Schwerter succeeds against a selected target
- **THEN** it SHALL create one 16-owner-turn übernatürlicher ActiveEffect containing +4 GS, +2 AT, and +2 VT semantic Ilaris modifiers
- **AND** each semantic modifier SHALL use `strongest-supernatural` stacking

#### Scenario: Named-skill effects use exact talent selectors and converted duration

- **WHEN** Adlerauge Luchsenohr, Innere Ruhe, Mondsilberzunge, or Rahjas Wohlgefallen succeeds against a selected target
- **THEN** it SHALL create one owner-turn ActiveEffect with +4 `talent` Ilaris modifiers restricted respectively to `Sinnenschärfe`/`Wachsamkeit`, `Selbstbeherrschung`, `Überreden`, or `Menschenkenntnis`/`Betören`
- **AND** the effect duration SHALL be respectively 64, 7,680, 960, or 960 Initiativephasen

#### Scenario: MR effects use the native MR path and converted duration

- **WHEN** Psychostabilis, Psychostabilis (Tiergeist), or Tanz des Ungehorsams succeeds against a selected target
- **THEN** it SHALL create one owner-turn ActiveEffect with a +4 additive `system.abgeleitete.mr` native change
- **AND** the effect duration SHALL be 960 Initiativephasen for either Psychostabilis source Item and 23,040 Initiativephasen for Tanz des Ungehorsams

#### Scenario: Deferred mechanics remain out of selected coverage

- **WHEN** a contributor reviews this coverage set
- **THEN** source Items requiring contact/crossing triggers, zones, repeated damage, resource changes, next-roll consumption, direct main-attribute changes, derived armor protection, condition enforcement, or ambiguous blessings SHALL remain without a new pre-effect from this change
- **AND** the inventory documentation SHALL identify those categories as deferred or manual
