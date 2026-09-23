## ADDED Requirements

### Requirement: E2E coverage verifies creature Actor summoning

The E2E suite SHALL verify _Krähenruf_ and _Skelettarius Totenherr_ against a
running Foundry v14 world with an active Scene and Combat. It SHALL cover a
GM cast and a player-owned-caster cast with an active GM, canvas placement,
persisted provenance, Krähenschwarm Mächtige-Magie values, timed cleanup, and
the two-phase readiness notification.

#### Scenario: Reviewed creature summons are visible and lifecycle-correct

- **WHEN** the E2E scenario casts both reviewed spells successfully
- **THEN** it SHALL observe their created Actor and Token documents on the Scene with their expected placement and provenance
- **AND** it SHALL observe Krähenruf cleanup and Skelettarius readiness after two forward global phases
