## ADDED Requirements

### Requirement: Structured spell modifications persist through auto-submit

A structured spell modification SHALL retain its full form state — including nested `preEffects` and their nested arrays — when the supernatural [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html) sheet auto-submits on a control change, without duplicating or corrupting Pre-Effects.

#### Scenario: Toggling a resistance checkbox does not add a pre-effect

- **WHEN** a GM toggles the "Widerstandsprobe aktiv" checkbox of a spell-modification Pre-Effect on or off
- **THEN** the Item SHALL persist the same number of Pre-Effects in that modification
- **AND** reopening the sheet SHALL show the same Pre-Effect list
