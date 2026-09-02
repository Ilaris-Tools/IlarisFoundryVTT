## Why

The übernatürlich combat dialog template has maneuver NUMBER inputs with `value="{{manoever.inputValue.value}}"`. When `inputValue.value` is the boolean `false` (unset NUMBER field default), Handlebars renders it as the string `"false"`, causing the browser to reject the input value with "The specified value 'false' cannot be parsed, or is out of range." This leaves the input in an invalid state, and after `updateSelectedActorsDisplay()` triggers a full dialog re-render on target selection, the invalid inputs can cause maneuver modifiers to silently fail.

## What Changes

- **MODIFIED**: `scripts/combat/templates/dialogs/uebernatuerlich.hbs` — maneuver NUMBER inputs default their value to `""` when `inputValue.value` is falsy/boolean, preventing the `"false"` string in number inputs

## Capabilities

### Modified Capabilities

- `combat`: Fix maneuver NUMBER input rendering in übernatürlich template to handle boolean `false` defaults

## Impact

- **Files modified**: `scripts/combat/templates/dialogs/uebernatuerlich.hbs` (line ~121)
- **No runtime behavior change** — only fixes HTML validity of number inputs
- **No API changes**
