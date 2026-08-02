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

#### Scenario: A GM checks a specific AT modifier against a general modifier

- **WHEN** a GM reads the guide's general and Klingenwaffen-specific AT example
- **THEN** the guide SHALL state that in Ilaris mode an applicable specific
  supernatural `+2 AT` suppresses an applicable general supernatural `+1 AT`
  rather than contributing `+3`
- **AND** it SHALL state that the strongest positive and strongest negative
  components apply independently, so `-5` suppresses `-3`

#### Scenario: A GM selects Foundry stacking mode

- **WHEN** a GM reads the guide's description of the `Foundry` world setting
- **THEN** it SHALL state that all Ilaris-Modifikatoren add in that mode

### Requirement: The guide preserves automation boundaries and Vorteil follow-up status

The new guide SHALL state that static Vorteil effects can use native Foundry
Änderungen, while context-dependent Vorteil effects such as _Eindrucksvoll I_
are not yet automated. It SHALL identify ordinary, additive Ilaris modifiers
for Vorteile as planned follow-up work and SHALL NOT claim that it is currently
available. The existing `Übersicht: Item-Konfigurationen` journal SHALL retain
its matching statement that _Eindrucksvoll I_ does not work automatically.

#### Scenario: A GM looks up a conditional Vorteil

- **WHEN** a GM reads the new guide for a Vorteil such as _Eindrucksvoll I_
- **THEN** the guide SHALL state that its context-dependent bonus cannot yet
  be configured as an automatic effect
- **AND** it SHALL identify support for ordinary Ilaris modifiers on Vorteile
  as planned follow-up work

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
