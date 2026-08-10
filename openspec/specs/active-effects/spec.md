## Purpose

Custom ActiveEffect system with owner-scoped turn timing, DOT support, and AppV2 configuration dialog.

## Requirements

### Requirement: ActiveEffect document class

The system SHALL provide `IlarisActiveEffect` extending `ActiveEffect` with support for formula resolution (`@` references), owner-scoped turn timing guards, and DOT (damage-over-time) change processing.

#### Scenario: Formula resolution on apply

- **WHEN** an IlarisActiveEffect is applied with a change value containing `@` references (e.g., `@attributes.koerperkraft.value`)
- **THEN** the formula SHALL be resolved via `Roll.replaceFormulaData()` before calling `super.apply()`

#### Scenario: WS change triggers HP recalculation

- **WHEN** an IlarisActiveEffect modifies `system.attribute.ws` (Willenskraft)
- **THEN** the system SHALL recalculate the actor's HP after applying the effect

#### Scenario: Owner-scoped effect prevents core expiry

- **WHEN** `isExpiryEvent()` is called for an effect with `system.ilarisTiming.durationType === "ownerTurns"`
- **THEN** the method SHALL return `false`, preventing core Foundry from expiring the effect

#### Scenario: Owner-scoped effect prevents core duration decrement

- **WHEN** `updateDuration()` is called for an effect with `system.ilarisTiming.durationType === "ownerTurns"`
- **THEN** the method SHALL no-op, preventing core Foundry from independently decrementing `duration.turns`

### Requirement: ActiveEffect configuration dialog

The system SHALL provide `IlarisActiveEffectConfig` extending `ActiveEffectConfig` (AppV2) with a fourth tab "Ilaris Dauer" for Ilaris-specific effect timing configuration.

#### Scenario: Ilaris Dauer tab renders

- **WHEN** an IlarisActiveEffect configuration sheet is opened
- **THEN** the sheet SHALL render a fourth tab labeled "Ilaris Dauer" alongside the core Details, Duration, and Changes tabs

#### Scenario: Duration type selection

- **WHEN** the user configures Ilaris timing on the effect
- **THEN** the UI SHALL offer duration type choices: `ownerTurns` (reduced on owner's turn) and `infinite` (never expires)

#### Scenario: Expiry point selection

- **WHEN** `durationType` is `ownerTurns`
- **THEN** the UI SHALL offer `expiresOn` choices: `turnStart` (expires at beginning of owner's turn) and `turnEnd` (expires at end of owner's turn)

#### Scenario: Attribute key autocomplete

- **WHEN** editing an effect change key
- **THEN** the sheet SHALL provide a `<datalist>` of valid attribute keys by recursively walking all registered Actor TypeDataModel schemas

#### Scenario: Long original duration shows its Ilaris hour or day equivalent

- **WHEN** an owner-turn effect has `originalValue` greater than 100 Initiativephasen
- **THEN** the duration tab SHALL keep the exact editable Initiativephase value visible
- **AND** it SHALL render a supplementary German equivalent in hours when the value is below 23,040 Initiativephasen and in days when it is at least 23,040 Initiativephasen

#### Scenario: Long remaining duration shows its Ilaris hour or day equivalent

- **WHEN** an owner-turn effect has `remaining` greater than 100 Initiativephasen
- **THEN** the duration tab SHALL keep the exact editable Initiativephase value visible
- **AND** it SHALL render the same supplementary German hours/days equivalent for the current remaining value

#### Scenario: Short duration does not show a redundant equivalent

- **WHEN** an owner-turn effect has an original or remaining value of 100 Initiativephasen or fewer
- **THEN** the duration tab SHALL not render a supplementary hours/days value for that field

### Requirement: Owner-scoped turn timing

The system SHALL decrement and expire `ownerTurns` effects only on the owning combatant's turn, using a two-phase architecture (combatTurn + updateCombat hooks).

#### Scenario: turnStart effect decremented immediately

- **WHEN** a combatant's turn begins (`combatTurn` hook fires) and they own an effect with `expiresOn === "turnStart"` and `remaining > 1`
- **THEN** the effect's `remaining` SHALL be decremented immediately and persisted

#### Scenario: turnStart effect expires immediately

- **WHEN** a combatant's turn begins and they own an effect with `expiresOn === "turnStart"` and `remaining === 1`
- **THEN** the effect SHALL be deleted immediately

#### Scenario: turnEnd effect deferred

- **WHEN** a combatant's turn begins and they own an effect with `expiresOn === "turnEnd"`
- **THEN** the decrement/expiry SHALL be flagged (`_pendingExpiry` / `_pendingDurationChange`) but NOT persisted until `updateCombat` fires

#### Scenario: turnEnd effect applied on combat update

- **WHEN** `updateCombat` fires and the turn index has changed
- **THEN** all pending `turnEnd` decrements and expiries SHALL be applied (persisted/deleted)

#### Scenario: Only GM processes timing

- **WHEN** a non-GM client receives a combat hook
- **THEN** the timing processing SHALL be skipped

#### Scenario: Backward turn change is skipped

- **WHEN** the combat turn moves backward (e.g., GM rewinds)
- **THEN** no timing processing SHALL occur

### Requirement: DOT (Damage Over Time) effects

The system SHALL support DOT effects using the `change.type === "dot"` change type registered as a first-class Foundry V14 change type via `foundry.data.fields.TypeDataField`.

#### Scenario: DOT effect identification

- **WHEN** an effect has changes with keys starting with `system.gesundheit.wunden` or `system.gesundheit.erschoepfungen` and `type === "dot"`
- **THEN** these changes SHALL be identified as DOT changes

#### Scenario: DOT damage application

- **WHEN** an effect with DOT changes is processed during owner turn timing
- **THEN** the DOT damage SHALL be applied to the owning actor and a ChatMessage SHALL be created documenting the tick

#### Scenario: DOT damage uses ilarisTiming

- **WHEN** a DOT effect is created
- **THEN** it SHALL use `system.ilarisTiming` with `durationType: "ownerTurns"` for turn-counted duration

### Requirement: Ilaris modifier data and configuration are available on effects

The system SHALL extend the custom ActiveEffect type data and
[ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html)
sheet to expose `system.ilarisModifiers` and the effect source classification
required by rule-aware modifiers. The configuration UI SHALL provide a
distinct German-labeled Ilaris-Modifikatoren section without altering the
native Foundry Changes tab.

#### Scenario: GM adds an Ilaris modifier in the effect configuration

- **WHEN** a GM opens an Ilaris ActiveEffect configuration sheet
- **THEN** the sheet SHALL allow the GM to add, edit, and remove declarative
  Ilaris modifiers including phase, target, value, stacking policy, source,
  and selectors

#### Scenario: Native change remains a native change

- **WHEN** a GM edits the core Changes tab of the same sheet
- **THEN** the edited entry SHALL remain in the ActiveEffect `changes` array
- **AND** it SHALL NOT implicitly create an `ilarisModifiers` entry

### Requirement: Main attributes use semantic modifiers exclusively

The system SHALL prevent a native ActiveEffect `changes` entry from directly
modifying a main-attribute path. The configuration UI and Pre-Effect processor
SHALL redirect an additive main-attribute change to a roll-phase semantic
`ilarisModifier` when its target can be mapped, and SHALL reject unsupported
main-attribute operations with a German validation message. The custom
ActiveEffect application logic SHALL skip a legacy direct main-attribute
change that bypassed those authoring paths.

#### Scenario: Additive GE change becomes a roll-only modifier

- **WHEN** a GM configures or generates an additive native change for the GE
  main-attribute path
- **THEN** the system SHALL store it as a semantic roll-phase GE modifier
- **AND** it SHALL NOT retain the direct main-attribute entry in `changes`

#### Scenario: Legacy direct main-attribute change cannot affect derived values

- **WHEN** an imported or legacy ActiveEffect contains a direct native GE or
  KK main-attribute change
- **THEN** IlarisActiveEffect SHALL not apply that native change
- **AND** it SHALL not alter any prepared attribute or derived value

### Requirement: Prepare-phase modifiers share the Actor effect lifecycle

The Ilaris Actor preparation flow SHALL resolve active `prepare` modifiers in
the documented
[Actor#applyActiveEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#applyActiveEffects)
lifecycle after applicable native changes have been determined and before
dependent Ilaris derived values are calculated. It SHALL apply the result only
to prepared actor data and SHALL NOT persist an actor update during data
preparation.

#### Scenario: Prepared value reflects an active modifier

- **WHEN** an active effect has a matching prepare-phase GS modifier
- **THEN** the actor's prepared GS SHALL include the resolved modifier before
  the actor's derived values are consumed

#### Scenario: Main-attribute modifier is excluded from preparation

- **WHEN** an active effect has a semantic prepare request for a main
  attribute such as GE or KK
- **THEN** the ActiveEffect preparation integration SHALL reject or redirect it
  to roll-phase resolution
- **AND** it SHALL NOT alter the prepared attribute or derived values

#### Scenario: Core priority remains effective

- **WHEN** native changes with Foundry modes and priorities coexist with
  prepare-phase Ilaris modifiers
- **THEN** native changes SHALL retain Foundry's documented handling
- **AND** the semantic modifier result SHALL be applied only in its defined
  Ilaris preparation step

### Requirement: ActiveEffects can expose a source-linked opposed escape action

The system SHALL expose a visible `Befreiungsprobe` action for an embedded ActiveEffect with `system.ilarisEnding.type: "opposedEscape"`. The ending data SHALL identify the source Actor by UUID and SHALL be limited to the supported GE/KK opposed escape configuration. Effects without that ending SHALL retain their existing effect-row behavior.

#### Scenario: The affected actor starts an escape attempt

- **WHEN** the affected actor activates `Befreiungsprobe` on an eligible opposed-escape effect
- **THEN** the system SHALL offer GE and KK with their current PW values
- **AND** it SHALL associate the resulting attempt with that exact effect

### Requirement: Opposed escape resolves through a source counter-check

After the affected actor submits an opposed escape roll, the system SHALL send a whispered counter-check prompt to a controlling user of the persisted source Actor, or to an active GM if none is available. A successful escape SHALL remove only the linked effect using [Actor#deleteEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#deleteEmbeddedDocuments).

#### Scenario: Successful escape removes only its own hold

- **WHEN** an affected actor wins the counter-check for one opposed-escape effect while another hold effect is also active
- **THEN** the system SHALL delete only the effect linked to that escape attempt
- **AND** the other hold effect SHALL remain active

#### Scenario: Failed escape preserves the effect

- **WHEN** the affected actor does not win the opposed counter-check
- **THEN** the linked effect SHALL remain active

### Requirement: Escape prompts validate their persisted context

The system SHALL validate the target Actor, effect ID, ending type, source Actor UUID, and single-use interaction identity before resolving an escape prompt. It SHALL reject a stale, duplicated, or mismatched prompt without deleting an effect.

#### Scenario: A duplicate prompt cannot remove an effect twice

- **WHEN** a previously resolved escape prompt is activated again
- **THEN** the system SHALL reject the prompt
- **AND** it SHALL not delete any ActiveEffect

### Requirement: Condition-source timing is independent per source

The owner-turn timing lifecycle SHALL reduce and remove timed condition sources independently, without using a condition effect's global duration to delete other sources. It SHALL use the existing documented [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html) embedded-document update/delete methods for the resulting ledger mutation.

#### Scenario: Timed source expires while another source remains

- **WHEN** an owner-turn source on a condition reaches its configured expiry
- **AND** the condition has another active source
- **THEN** the system SHALL remove only the expired source
- **AND** the condition ActiveEffect SHALL remain active

#### Scenario: Timed source is final source

- **WHEN** an owner-turn source is the final source on a condition and reaches its configured expiry
- **THEN** the system SHALL delete the condition ActiveEffect at its configured expiry point

## Data Model

### IlarisActiveEffectDataModel (`system.ilarisTiming`)

| Field          | Type        | Description                                          |
| -------------- | ----------- | ---------------------------------------------------- |
| `durationType` | StringField | `"ownerTurns"` or `"infinite"`                       |
| `expiresOn`    | StringField | `"turnStart"` or `"turnEnd"` (only for `ownerTurns`) |
| `remaining`    | NumberField | Turns remaining (decremented on owner's turn)        |
| `original`     | NumberField | Original value for display/reference                 |

### DOT Changes

DOT changes use core `ActiveEffectChange` with `type: "dot"` and `key` starting with `system.gesundheit.wunden` or `system.gesundheit.erschoepfungen`.

## Cross-References

- [combat](../combat/spec.md) — Combat hooks that trigger turn timing processing
- [actor-sheets](../actor-sheets/spec.md) — Actor data models that provide attribute keys for autocomplete
