## Context

Zone tests mix temporary documents with persistent world state. The
Dämonenbann test counts unrelated effects, while the Pestgestank cone result
requires deterministic geometry validation.

## Goals / Non-Goals

**Goals:** isolate fixture ownership and verify real zone containment.

**Non-Goals:** change zone rules merely to satisfy an assertion.

## Decisions

- Track created Region, Token, Actor, and effect identifiers and assert only
  those owned by the test region.
- Use grid-relative coordinates and direct containment assertions before
  changing zone-target code.

## API Surface

- [Region](https://foundryvtt.com/api/v14/classes/foundry.documents.Region.html),
  [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html),
  and [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html).
- No new Hooks; inspect existing `foundry.utils` helpers before adding fixture utilities.

## Risks / Trade-offs

- [Fixture isolation hides a targeting defect] → retain an assertion that the
  inside token is selected and the outside token is excluded.

## Migration Plan

No persistent data migration.

## Testing Strategy

Run PackAndRestart and E2E-037, E2E-038, and E2E-040 independently and in one
serial suite; collect IDs and cleanup evidence in every finally block.
