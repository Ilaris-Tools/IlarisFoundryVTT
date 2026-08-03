## Context

Existing E2E cases assert that controls exist and can be programmatically clicked, which is insufficient for AppV2 dialogs whose content can be clipped. Several fixed release regressions therefore need behavioural and visual regression coverage.

## Goals / Non-Goals

**Goals:** prove critical controls are visible or reachable by scrolling; prove created/imported Held sheets render; cover derived WS values, token HUD layout, JSON sync combat controls, and chat roll-mode defaults.

**Non-Goals:** repair or migrate orphaned legacy token statuses; alter released business behaviour beyond adding tests or small testability selectors.

## Decisions

- E2E layout checks use element bounding boxes, computed styles, and explicit scroll actions; DOM presence alone is insufficient.
- WS/WS\* ActiveEffect ordering is unit-tested because it is deterministic actor-data logic; sheet/rendering, dialogs, HUD layout, and sync flows are E2E-tested.
- Legacy status IDs remain unsupported and receive no migration test.

## API Surface

Uses documented `Actor`, `ActiveEffect`, `TokenDocument`, `ChatMessage`, `game.settings`, `CONFIG.ChatMessage.modes`, and `DialogV2`; no Hooks or `foundry.utils.*` helpers are expected.

## Testing Strategy

Extend E2E-016/017/020 and dialog cases; add dedicated token HUD and roll-mode coverage. Add focused Jest coverage for Held derived-value ordering. Run affected E2E cases and the full serial suite.

## Risks / Trade-offs

- [Risk] geometry varies by viewport → use the fixed Playwright viewport and assert reachability rather than fixed pixels.
- [Risk] HUD markup varies across Foundry releases → use stable status IDs and visual grouping assertions.
