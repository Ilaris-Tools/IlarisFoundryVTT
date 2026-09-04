# spell-zone-lifecycle Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Structured zone profile

Supernatural items and selected spell modifications SHALL support an optional normalized zone profile containing shape, dimensions, pivot, placement anchor, placement range, lifecycle, explicit duration, trigger timing, and a `targeting.includeCaster` policy. The profile SHALL remain absent for non-zone items. `targeting.includeCaster` SHALL default to `false` and SHALL filter only the source Token from automatic zone target resolution.

#### Scenario: Cone profile is normalized

- **WHEN** Tlalucs Odem Pestgestank is loaded with its zone data
- **THEN** the normalized profile SHALL identify a cone with length 8, angle 45 degrees, caster anchor, and tip pivot

#### Scenario: Rectangle profile is normalized

- **WHEN** Wand aus Dornen is loaded with its zone data
- **THEN** the normalized profile SHALL identify a rectangle with length 4, width 1, free placement, top-left pivot, and placement range 8

#### Scenario: Persistent duration uses global scene rounds

- **WHEN** a persistent zone profile is normalized
- **THEN** its duration SHALL use `sceneRounds` with explicit `remaining` and `originalValue` values
- **AND** 16 minutes SHALL be authored as 256 scene rounds using the established conversion of 16 initiative phases per minute

#### Scenario: Modification replaces zone geometry

- **WHEN** Miasmasphaero is selected for Tlalucs Odem Pestgestank
- **THEN** the effective profile SHALL replace the cone with a caster-centered circle while retaining the modification's effective spell profile

#### Scenario: Caster targeting is opt-in

- **WHEN** a zone does not set `targeting.includeCaster`
- **THEN** the automatic target resolver SHALL exclude its source Token while retaining other Tokens, including Tokens representing the same Actor
- **AND WHEN** the profile sets `targeting.includeCaster` to `true`
- **THEN** the source Token SHALL remain eligible for normal Region containment

### Requirement: Visible draft-zone placement

The supernatural dialog SHALL show `Zone platzieren` above `Würfelaktionen` only when target selection is enabled and the selected form has a normalized zone profile. It SHALL use the documented `canvas.regions.placeRegion(..., { create: false })` API to place a shape, then retain the result as an inert GM-owned Scene Region draft marked under `flags.Ilaris.zoneDraft`. The placement range for free zones SHALL be measured from the caster token center. Caster-anchored zones SHALL bypass free-placement range validation: circles use the caster token center without free placement, while directional shapes place their pivot at the outward boundary of the caster's public [`Token#getShape()`](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html#getShape), in the selected direction, plus a one-pixel outward epsilon. Drafts SHALL be deleted before replacement placement, on a modification change, cancellation, dialog close, or failed cast. The implementation SHALL NOT call deprecated MeasuredTemplate APIs.

#### Scenario: Maneuver range modifies placement

- **WHEN** a casting maneuver adds placement range
- **THEN** the preview SHALL allow the zone pivot up to base range plus the maneuver bonus from the caster token center

#### Scenario: Placement is cancelled

- **WHEN** the user cancels zone placement
- **THEN** the spell SHALL not roll, pay energy, or create an active persistent Region

#### Scenario: Confirmed draft remains visible before casting

- **WHEN** the user confirms `Zone platzieren`
- **THEN** the active GM SHALL create an inert Scene Region draft visible on the map
- **AND** roll actions SHALL become available without starting a roll

#### Scenario: Draft cleanup

- **WHEN** a draft is replaced, its dialog closes, the selected modification changes, or its cast fails
- **THEN** the active GM SHALL delete that draft without applying effects or changing resources

#### Scenario: Placement is redone

- **WHEN** the user activates the supernatural dialog's redo-placement button
- **THEN** the current temporary placement SHALL be discarded and a new preview SHALL be opened before rolling

### Requirement: Successful instant-zone resolution

An instant zone SHALL resolve only after a successful spell roll. Current tokens contained in the confirmed Region SHALL be converted into token-aware `selectedActors` and passed to the existing pre-effect pipeline using `RegionDocument.tokens` or `TokenDocument.testInsideRegion`.

#### Scenario: Tlalucs cone affects current occupants

- **WHEN** Tlalucs Odem Pestgestank succeeds with a confirmed cone
- **THEN** every token selected by Foundry's standard Region containment behavior SHALL receive the existing pre-effect processing once

#### Scenario: Failed instant zone has no effects

- **WHEN** an instant zone spell fails
- **THEN** no target SHALL receive damage, a resistance prompt, or a persistent zone Region

### Requirement: Persistent zone document and global duration

A persistent zone SHALL create a Region document on the active Scene after a successful cast, storing resolved Ilaris zone metadata under `flags.Ilaris.zone`. The active GM SHALL own document creation and lifecycle processing. The zone SHALL remain until its resolved scene-round duration expires or the Region is deleted. The `Scene`, `RegionDocument`, and document embedded-document APIs SHALL be verified against v14 before implementation: [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), [RegionDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.RegionDocument.html).

#### Scenario: Wand aus Dornen persists

- **WHEN** Wand aus Dornen succeeds with confirmed placement
- **THEN** the active GM SHALL create a Region on the scene with its effective profile, caster context, spell UUID, application ID, trigger configuration, and resolved scene-round timing

#### Scenario: Global duration decrements once per combat round

- **WHEN** the active GM processes a forward Foundry `combatRound`
- **THEN** every active persistent zone on that Scene SHALL reduce its remaining scene rounds by one regardless of combatant ownership
- **AND** zones SHALL not age automatically outside combat

#### Scenario: Persistent zone expires

- **WHEN** a persistent zone reaches its resolved duration
- **THEN** the Region SHALL be removed and no future trigger SHALL be dispatched

### Requirement: Creation, entry, and re-entry triggers

Persistent zones SHALL support `triggerOnCreate` and `onEnter` trigger flags. `triggerOnCreate` SHALL default to `true`; entry SHALL include re-entry after the token leaves. The active GM SHALL dispatch these triggers and persist enough membership and deduplication state on the Region to prevent repeated document updates from duplicating a trigger.

#### Scenario: Initial occupant triggers by default

- **WHEN** a persistent zone is created with an intersecting token and `triggerOnCreate` is omitted
- **THEN** the token SHALL receive one creation trigger

#### Scenario: Re-entry triggers again

- **WHEN** a token leaves a persistent zone and later enters it again
- **THEN** the zone SHALL dispatch a new entry trigger for that token

### Requirement: Resistance and token context

Zone-triggered effects SHALL reuse the existing resistance and pre-effect pipelines and SHALL preserve `tokenId`, `actorId`, and `actorLink` so unlinked token actors are resolved from the token first. Resistance prompts SHALL be dispatched once per trigger event and SHALL apply the result only to the triggering token actor.

#### Scenario: Thorn wall sends an entry resistance prompt

- **WHEN** a token enters Wand aus Dornen and its pre-effect has an enabled avoid test
- **THEN** the controlling client SHALL receive the existing resist prompt with the originating zone and token context

#### Scenario: Duplicate movement update does not duplicate prompt

- **WHEN** several token updates occur while the token remains inside the wall
- **THEN** only one prompt SHALL be created for that entry event

#### Scenario: Thorn wall does not enforce movement in the first slice

- **WHEN** a token enters Wand aus Dornen
- **THEN** the zone SHALL use the configured resistance and attempt-damage outcome
- **AND** the system SHALL not move the token back or enforce full wall crossing

### Requirement: Zone profile authoring supports duration sources

The concrete supernatural Item sheet SHALL expose a persistent Zone's `Dauerquelle` directly after `Lebenszyklus`. It SHALL offer `Fester Wert` and `Attribut der zaubernden Person`. A fixed source SHALL show `Szenenrunden`; an attribute source SHALL show the configured main-attribute selector. The same order SHALL be used for a structured form's Zonenform before its Form-Pre-Effects, while the existing Zone section remains before structured forms and Pre-Effects.

#### Scenario: Author chooses a KO duration source

- **WHEN** a GM chooses `Attribut der zaubernden Person` and KO in a persistent Zone editor
- **THEN** the Item SHALL persist `duration.source: "casterAttribute"` and `duration.attribute: "KO"`
- **AND** no fixed Scene-round input SHALL be presented as the active source

### Requirement: A resolved duration source uses the standard Zone lifecycle

After a caster-attribute source is resolved, the created Region SHALL use the existing persistent Zone `sceneRounds` lifecycle and existing [`combatRound`](https://foundryvtt.com/api/v14/functions/hookEvents.combatRound.html) dispatch/expiry ordering. Existing numeric Zone profiles and persisted Regions SHALL retain their behavior.

#### Scenario: Final sourced round triggers before expiry

- **WHEN** a sourced persistent Zone has one resolved Scene round remaining and enables `onRoundStart`
- **THEN** it SHALL dispatch its current-occupant event before the Region is removed by normal duration expiry

### Requirement: Zone profiles author an opt-in movement resistance

A normalized persistent Zone profile SHALL default `movementResistance.enabled`
to `false`. When enabled, it SHALL persist a selected main attribute, fixed
resistance difficulty, and German failure-marker label. The concrete
supernatural Item sheet SHALL render its `Bewegungswiderstand` control after
the existing creation, entry, and round-start trigger controls and before Zone
removal; when enabled, `Attribut` and `Schwierigkeit` SHALL be visible below
it. Structured form Zone editors SHALL retain the same local order before
their Zone buttons. Existing Zone controls and sections SHALL not move.

#### Scenario: GM authors movement resistance

- **WHEN** a GM enables `Bewegungswiderstand`, selects GE, and enters 16
- **THEN** the Item SHALL persist `movementResistance.enabled: true`,
  `attribut: "GE"`, and `resistDifficulty: 16`

#### Scenario: Existing profiles remain inert

- **WHEN** an existing persistent Zone omits `movementResistance`
- **THEN** its normalized profile SHALL disable movement resistance
- **AND** normal movement SHALL retain its existing behavior
