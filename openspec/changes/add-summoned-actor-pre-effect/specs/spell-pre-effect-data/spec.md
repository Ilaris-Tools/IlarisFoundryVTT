## ADDED Requirements

### Requirement: Krähenruf and Skelettarius author reviewed Actor summon data

The creature compendium SHALL contain a _Krähenschwarm_ source Actor with the
published _Krähenruf_ baseline combat values. _Krähenruf_ SHALL define a timed
`casterAdjacent` actor summon lasting 16 initiative phases and source overrides
that add one WS, AT, and TP per Mächtige-Magie QS. _Skelettarius Totenherr_
SHALL define a permanent `selectedTarget` summon using the reviewed Skelett
creature source and an activation delay of two global initiative phases.

#### Scenario: Krähenruf has a complete timed summon source

- **WHEN** _Krähenruf_ and _Krähenschwarm_ are examined in compendium `_source/`
- **THEN** the spell SHALL reference the creature source by UUID with a 16-phase timed actor-summon pre-effect
- **AND** the source SHALL contain WS 3, Koloss I, INI 6, GS 8, VT 3, RW 2, AT 10, TP `2W6–2`, and Zusätzliche AT I before its configured amplification

#### Scenario: Skelettarius has a permanent delayed undead source

- **WHEN** _Skelettarius Totenherr_ is examined in compendium `_source/`
- **THEN** it SHALL reference the reviewed Skelett source by UUID with permanent selected-target placement
- **AND** it SHALL configure an activation delay of two initiative phases
