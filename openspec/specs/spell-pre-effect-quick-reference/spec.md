## Purpose

Document spell, liturgy, and Pre-Effect authoring in the German
`kurzuebersichten` quick-reference compendium.

## Requirements

### Requirement: The quick-reference compendium documents Pre-Effect authoring

The `kurzuebersichten` compendium SHALL contain a German
[JournalEntry](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntry.html)
named `Übersicht: Zauber, Liturgien & Pre-Effects`, with one text
[JournalEntryPage](https://foundryvtt.com/api/v14/classes/foundry.documents.JournalEntryPage.html)
whose source content uses structured HTML. The journal SHALL explain the
successful-cast-to-effect flow, duration and instant Pre-Effects, native
Änderungen, resistance tests, diminished outcomes, and Mächtige Magie.

#### Scenario: A game master opens the spell and Pre-Effect guide

- **WHEN** a game master opens `Übersicht: Zauber, Liturgien & Pre-Effects`
  from the quick-reference compendium
- **THEN** the journal SHALL render a structured German guide for authoring
  supported spell and liturgy Pre-Effects
- **AND** it SHALL distinguish instant damage/healing from duration-based
  Active Effects

### Requirement: The guide accurately explains Ilaris modifiers and stacking

The guide SHALL distinguish unconditional native Foundry Änderungen from
context-sensitive Ilaris-Modifikatoren. It SHALL document preparation and roll
phases, targets, selectors, applied/suppressed component visibility, and both
world-setting stacking modes. It SHALL state that main attributes only modify
matching rolls and do not change prepared values or derived values such as GS.
It SHALL distinguish retaining/suppressing same-spell effects in Ilaris mode
from replacing all ActiveEffects from the same supernatural source in Foundry
mode.

#### Scenario: A GM checks a specific AT modifier against a general modifier

- **WHEN** a GM reads the guide's general and Klingenwaffen-specific AT example
- **THEN** the guide SHALL state that in Ilaris mode an applicable specific
  supernatural `+2 AT` suppresses an applicable general supernatural `+1 AT`
  rather than contributing `+3`
- **AND** it SHALL state that the strongest positive and strongest negative
  components apply independently, so `-5` suppresses `-3`

#### Scenario: A GM selects Foundry stacking mode

- **WHEN** a GM reads the guide's description of the `Foundry` world setting
- **THEN** it SHALL state that distinct Ilaris-Modifikatoren add in that mode
- **AND** it SHALL state that recasting the same persistent spell or liturgy
  replaces all prior ActiveEffects from that source and refreshes their
  duration

### Requirement: The guide preserves automation boundaries and Vorteil follow-up status

The guide SHALL state that static Vorteil effects can use native Foundry
Änderungen and that supported context-dependent Vorteile can use ordinary,
additive Ilaris modifiers. It SHALL document that the player or GM selects the
applicable roll condition for each dialog and that this choice is not inferred
from the world or persisted. It SHALL identify remaining Vorteil rules that
alter fumbles, information quality, maneuvers, regeneration, duration,
resources, targets, or locations as manual follow-up work. The existing
`Übersicht: Item-Konfigurationen` journal SHALL link or refer readers to this
guide for the supported contextual modifier workflow and SHALL not state that
Eindrucksvoll I is wholly unsupported.

#### Scenario: A GM looks up a conditional Vorteil

- **WHEN** a GM reads the guide for a Vorteil such as Eindrucksvoll I
- **THEN** the guide SHALL explain its ordinary Ilaris modifier and required
  dialog situation
- **AND** it SHALL identify non-probe side effects as manual where applicable

#### Scenario: A GM checks a location-dependent supernatural Vorteil

- **WHEN** a GM reads the guide for a Vorteil such as Kraftlinienmagie
- **THEN** the guide SHALL state that the player or GM selects the applicable
  condition and strength for that individual roll
- **AND** it SHALL NOT claim that Foundry detects the location or its strength

### Requirement: The guide states the remaining manual mechanics

The guide SHALL identify that Pre-Effects automate only their configured,
supported consequences. It SHALL state that next-relevant-roll consumption,
moving or repeatedly-triggered zones, target-category restrictions, and
comparable deferred mechanics remain manual.

#### Scenario: A GM configures a next-roll-only miracle

- **WHEN** a GM consults the guide for a next-relevant-roll-only effect
- **THEN** the guide SHALL not describe a timed Active Effect as automatic
  one-roll consumption
- **AND** it SHALL direct the GM to handle that consequence manually

### Requirement: The guide documents resistance-difficulty source modes

The German `Übersicht: Zauber, Liturgien & Pre-Effects` JournalEntry SHALL document resistance difficulties as an explicit authoring choice. It SHALL explain that `Fester Wert` uses the numeric value and defaults to 12, while `Ergebnis der auslösenden Probe` uses the completed triggering roll's result. It SHALL state that the latter is appropriate for reviewed combat maneuvers such as _Entwaffnen_ and _Niederwerfen_, rather than assigning a magic value of 0 to the fixed-difficulty field.

#### Scenario: A GM authors a maneuver resistance

- **WHEN** a GM opens the Pre-Effect quick reference to configure a maneuver resistance
- **THEN** the guide SHALL identify `Ergebnis der auslösenden Probe` as the appropriate source when the defender rolls against the maneuver user's completed result
- **AND** it SHALL state that a numeric zero remains a fixed value, not a source selector

### Requirement: The Zone guide documents wall traversal boundary behavior

The German Zone automation quick reference SHALL state that _Wand aus Dornen_
uses the wall-specific traversal lifecycle rather than generic Region entry.
It SHALL explain that placing a wall over an already-contained Token has no
automatic consequence; a later normal movement into or out of the wall causes
the reviewed `2W6 TP` and GE 16 resistance flow. It SHALL retain the statement
that failed movement remains GM-managed and does not automatically reposition a
Token.

#### Scenario: A GM checks an initially contained Token

- **WHEN** a GM reads the Zone guide before placing _Wand aus Dornen_ over a Token
- **THEN** the guide SHALL state that placement alone neither damages the Token nor opens a resistance prompt
- **AND** it SHALL state that a later normal outbound movement is one traversal attempt
