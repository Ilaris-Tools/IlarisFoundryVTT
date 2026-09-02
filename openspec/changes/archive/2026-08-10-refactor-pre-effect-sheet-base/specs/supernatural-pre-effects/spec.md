## MODIFIED Requirements

### Requirement: Pre-effects GUI on item sheet

The übernatürlich item sheet SHALL render the `preEffects` array as an
editable list with inline form fields by extending the shared
`PreEffectItemSheet` and supplying its supernatural `form` Handlebars part.
The shared base SHALL provide the Pre-Effect named part and editor lifecycle;
the resulting authoring controls and persisted data SHALL remain the standard
Pre-Effect structure.

#### Scenario: Pre-effects section renders on sheet

- **WHEN** a Zauber, Liturgie, or Anrufung item sheet is opened
- **THEN** the sheet SHALL render a `Pre-Effects` section listing all existing
  pre-effects

#### Scenario: Add pre-effect button

- **WHEN** the user clicks `Add Pre-Effect`
- **THEN** a new pre-effect entry SHALL be appended to the `preEffects` array
  with default values

#### Scenario: Delete pre-effect button

- **WHEN** the user clicks the delete button on a pre-effect entry
- **THEN** that entry SHALL be removed from the `preEffects` array

#### Scenario: Pre-effect fields are editable

- **WHEN** the user edits any field within a pre-effect entry (baseDuration,
  instant, amplifiedByMaechtigeMagie, change fields, avoidTest fields)
- **THEN** the values SHALL be persisted to `system.preEffects[N].<field>` on
  save

#### Scenario: Avoid test fields shown conditionally

- **WHEN** `avoidTest.enabled` is checked
- **THEN** the avoidTest sub-fields (fertigkeit/talent/attribut,
  diminishedOnly, diminishedValue) SHALL be displayed

#### Scenario: Avoid test fields hidden when disabled

- **WHEN** `avoidTest.enabled` is unchecked
- **THEN** the avoidTest sub-fields SHALL be hidden
