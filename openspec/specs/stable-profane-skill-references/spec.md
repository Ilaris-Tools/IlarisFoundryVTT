## Purpose

Stable embedded Item references for profane skill checks from the hero sheet and in FertigkeitDialog.

## Requirements

### Requirement: Profane skill dialog uses embedded Item IDs

Normal profane skill rolls SHALL pass the selected skill's stable embedded Item ID from the hero sheet to `FertigkeitDialog`. The dialog SHALL retrieve the selected skill from the owning [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) through its [EmbeddedCollection#get](https://foundryvtt.com/api/classes/foundry.abstract.EmbeddedCollection.html) ID lookup when calculating PW and PWT.

#### Scenario: Hero-sheet roll control carries a profane skill Item ID

- **WHEN** a hero sheet renders a profane skill row
- **THEN** its normal-skill roll control SHALL contain that row's `profert.id` as its skill reference

#### Scenario: Dialog calculates PW for no-talent skill roll

- **WHEN** a profane skill dialog is opened with a valid skill Item ID and `ohne Talent` is selected
- **THEN** the dialog SHALL use the current selected Item's `system.pw`

#### Scenario: Dialog calculates PWT for talent skill roll

- **WHEN** a profane skill dialog is opened with a valid skill Item ID and a talent is selected
- **THEN** the dialog SHALL use the current selected Item's `system.pwt`

#### Scenario: Non-profane dialog types retain their references

- **WHEN** an attribute, free-skill, or simple dialog is opened
- **THEN** its existing attribute key or null reference behavior SHALL remain unchanged
