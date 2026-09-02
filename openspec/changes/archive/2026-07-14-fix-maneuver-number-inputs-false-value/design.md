## Context

The übernatürlich dialog template (`uebernatuerlich.hbs`) renders maneuver-specific input fields dynamically. Maneuvers with `inputValue.field === "NUMBER"` render `<input type="number">` with `value="{{manoever.inputValue.value}}"`. When no value has been set, `inputValue.value` is the boolean `false`.

Handlebars renders `false` as the string `"false"` (unlike `undefined` or `null` which render as empty). The browser's `<input type="number">` cannot parse `"false"` and logs a console warning, leaving the input in an invalid state.

## Decisions

### Decision: Guard the value with a conditional

**Chosen**: Add a Handlebars conditional to only render the `value` attribute when `inputValue.value` is truthy:

```hbs
value="{{#if manoever.inputValue.value}}{{manoever.inputValue.value}}{{/if}}"
```

**Alternatives considered**:

- **Fix data model defaults**: Rejected — would require migration of existing compendium data.
- **Use `{{#if (isNumber ...)}}`**: Rejected — requires registering a custom Handlebars helper.

**Rationale**: Simplest fix. `0` is truthy in JavaScript but handled correctly — if the user explicitly sets value to `0`, `inputValue.value` would be the number `0` (truthy), which renders correctly. The `false` default is the only problematic case.
