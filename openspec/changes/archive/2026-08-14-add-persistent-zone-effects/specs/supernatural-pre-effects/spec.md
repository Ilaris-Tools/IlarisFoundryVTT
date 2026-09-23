## ADDED Requirements

### Requirement: Pre-effect processor materializes passive Zone applications

The Pre-Effect processor SHALL accept explicit passive-Zone context from the Region lifecycle service. For a valid non-instant, non-resistance Pre-Effect it SHALL create an infinite-timing ActiveEffect with passive Zone provenance and SHALL preserve token-safe target context.

#### Scenario: Passive Pre-Effect creates an infinite ActiveEffect

- **WHEN** a persistent passive Zone applies a valid non-instant Pre-Effect to a contained Token
- **THEN** the processor SHALL create an ActiveEffect with `system.ilarisTiming.durationType: "infinite"`
- **AND** it SHALL retain the originating Region and Token identifiers

#### Scenario: Passive mode does not route a resistance prompt

- **WHEN** a passive Zone encounters a Pre-Effect with `avoidTest.enabled: true`
- **THEN** the processor SHALL not create an ActiveEffect or resistance prompt for it
- **AND** the existing triggered-resistance Zone behavior SHALL remain available for a triggered Zone

### Requirement: Explicit marker-only Pre-Effects are visible ActiveEffects

The Pre-Effect processor SHALL treat `marker.enabled: true` as an explicit request to create a visible ActiveEffect even when the Pre-Effect has no mechanical changes. It SHALL retain `system.ilarisMarker: true` on the created effect. An otherwise empty Pre-Effect without the marker flag SHALL remain a no-op.

#### Scenario: Marker-only passive Zone effect is created

- **WHEN** a passive Zone applies a non-instant Pre-Effect with `marker.enabled: true` and no mechanical changes
- **THEN** the processor SHALL create one visible infinite-timing ActiveEffect with passive Zone provenance
- **AND** the effect SHALL carry `system.ilarisMarker: true`
