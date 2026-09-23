## Context

E2E-027 shows that changing a summon-item source kind is not persisted and a
new modifier row lacks an expected selector. Both paths use the shared
Pre-Effect item-sheet update lifecycle.

## Goals / Non-Goals

**Goals:** persist source-kind changes, render complete modifier rows, and
retain existing Pre-Effect data.

**Non-Goals:** change source catalogs or Pre-Effect data semantics.

## Decisions

- Trace the existing AppV2 form listener and structured update path before
  changing the template.
- Preserve the existing Pre-Effects tab ordering and use its established
  Handlebars context rather than inline markup.

## API Surface

- Foundry classes: existing Item sheet AppV2 lifecycle only; verify v14 before
  implementation.
- Hooks: none new. Utilities: existing `foundry.utils.expandObject` or clone
  helpers only if already used by the sheet.

## Risks / Trade-offs

- [Fixing one control drops adjacent nested data] → assert full persisted
  object shape after each user-visible change.

## Migration Plan

No migration; stored source data remains valid.

## Testing Strategy

Add focused sheet tests and run E2E-027 from a clean world, including reopen
and persistence checks for both affected controls.
