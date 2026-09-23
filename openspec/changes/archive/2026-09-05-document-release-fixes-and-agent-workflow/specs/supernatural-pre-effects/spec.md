## ADDED Requirements

### Requirement: Pre-effect editor preserves stored select values

The übernatürlich item-sheet pre-effect editor SHALL render each change type and avoid-test attribute select with its stored value selected after a complete form submission.

#### Scenario: Stored change type remains selected

- **WHEN** a pre-effect change stores `type: 'custom'` and the item sheet is re-rendered
- **THEN** the `custom (DOT)` change-type option SHALL be selected

#### Scenario: Stored avoid-test attribute remains selected

- **WHEN** a pre-effect stores `avoidTest.attribut: 'KO'` and the item sheet is re-rendered
- **THEN** the `KO` avoid-test attribute option SHALL be selected

### Requirement: Resistance targets use document UUIDs

Resistance prompts SHALL serialize the target Actor's UUID and resolve it with [`foundry.utils.fromUuid`](https://foundryvtt.com/api/v14/modules/foundry.utils.html#fromUuid), so a synthetic Actor belonging to an unlinked Token can be resolved. Legacy world-actor IDs MAY be accepted only as a backward-compatible fallback.

#### Scenario: Unlinked token actor receives a resistance prompt

- **WHEN** a pre-effect requires a resistance test against an unlinked Token's synthetic [`Actor`](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html)
- **THEN** the prompt payload SHALL contain that Actor's UUID
- **AND** the resist handler SHALL resolve that UUID before opening the FertigkeitDialog or applying the result

#### Scenario: Resistance target cannot be resolved

- **WHEN** the serialized target UUID and any legacy target ID cannot be resolved
- **THEN** the handler SHALL show a German warning notification
- **AND** it SHALL not open a FertigkeitDialog or apply an effect to an unintended actor

### Requirement: Resistance prompt content is escaped

The resistance chat prompt SHALL HTML-escape spell and test names before interpolating them into message content created through [`ChatMessage`](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html).

#### Scenario: Spell name contains HTML-significant characters

- **WHEN** a resistance prompt is created for a spell or test name containing `<`, `>`, `&`, quotes, or apostrophes
- **THEN** the rendered prompt SHALL display those characters as text
- **AND** the name SHALL not create executable or structural HTML
