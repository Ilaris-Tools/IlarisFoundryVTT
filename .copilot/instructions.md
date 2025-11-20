# Copilot Custom Instructions for IlarisFoundryVTT

## Purpose

This repository is a Foundry VTT game system module to support the Ilaris ruleset (German “Das Schwarze Auge”/DSA variant) in Foundry VTT v10+. It extends and maintains the prior project from https://gitlab.com/Feorg/ilaris-foundryvtt for modern Foundry compatibility.

## Core Technologies

-   JavaScript (main logic and API integration)
-   Handlebars (templates for UI in Foundry)
-   CSS (styling Foundry sheets, UI)
-   Python (build scripts only; do not edit or suggest code in `/tools` for Foundry runtime)
-   HTML (embedded in Handlebars)
-   Foundry VTT system API: https://foundryvtt.com/api/

## Guidelines for Copilot Suggestions

-   The main entry point is in `scripts/` (not `src/`).
-   Use Foundry VTT API idioms: prefer hooks, game.system, and actor/item patterns.
-   Never generate or modify anything in `.gitlab/` or unrelated legacy directories.
-   Do NOT generate, remove, or rename `system.json` by hand – only modify it when required by manifest/schema change, and always keep keys sorted.
-   For Handlebars templates:
    -   Use the `{{localize 'KEY'}}` helper for user text.
    -   Use `data-` attributes for interactive hooks.
-   CSS: Use the class prefix `.ilaris-` for all custom classes, don't suggest generic classnames.
-   When referencing rules, prefer Ilaris terms (e.g., “Fertigkeit”, “Talent”, “Probe”) over generic RPG parlance. Check base rules at the provided documentation.
-   Always add comments to new functions or classes, especially when using Foundry-specific idioms.
-   When writing roll formulas, use the Foundry Roll syntax and utilities.
-   Use the most up-to-date version of the Foundry API (see https://foundryvtt.com/api/).

## Should Not

-   Never hard-code sheet styling: always use classes, preferably `.ilaris-*`.
-   Do not use jQuery – Foundry VTT provides its own API for DOM manipulation.
-   Never store secret or sensitive information in the client-facing code.

## Resources

-   Foundry VTT Knowledge Base: https://foundryvtt.com/kb/
-   Foundry VTT API Docs: https://foundryvtt.com/api/
-   Consider existing German-language docs and DSA conventions.

## Common Pitfalls

-   Avoid conflicts with other modules: scope all global variables and classes as `ilaris*`.
-   Foundry sheet rendering can be async—handle race conditions.
-   All world/user data must be stored via the proper Foundry mechanisms.

---

_These instructions are for Copilot suggestions when editing this repository. Please keep them updated with new best practices or architectural changes._
