# Task: Replace Deprecated {{select}} Handlebars Helper

## Problem

The `{{select}}` handlebars helper is deprecated in Foundry VTT:

- **Deprecated since:** Version 12
- **Backwards-compatible support will be removed in:** Version 14
- **Replacement:** Use `{{selectOptions}}` helper or the foundry.applications.fields methods

## Files to Update

The following 13 template files use the deprecated `{{#select}}` helper:

1. `templates/sheets/items/fertigkeit.hbs` - 4 occurrences
2. `templates/sheets/items/base_item_layout.hbs` - 1 occurrence
3. `templates/sheets/items/talent.hbs` - 1 occurrence
4. `templates/chat/probendiag_fernkampf.hbs` - 1 occurrence
5. `templates/sheets/items/uebernatuerlich_fertigkeit.hbs` - 3 occurrences
6. `templates/chat/probendiag_profan.hbs` - 1 occurrence
7. `templates/chat/probendiag_nahkampf.hbs` - 1 occurrence
8. `templates/sheets/items/uebernatuerlich_talent.hbs` - 1 occurrence

## Current Pattern

The deprecated pattern looks like this:

```handlebars
<select name="system.attribut_0">
    {{#select item.system.attribut_0}} {{>
    systems/Ilaris/templates/helper/select_attribut.hbs}} {{/select}}
</select>
```

Or:

```handlebars
<select name="system.gruppe">
    {{#select item.system.gruppe}} {{>
    systems/Ilaris/templates/helper/select_fertigkeitsgruppe.hbs}} {{/select}}
</select>
```

Or inline:

```handlebars
<select name='system.aufbewahrungs_ort'>
    {{#select item.system.aufbewahrungs_ort}}
        {{#each speicherplatz_list as |ort|}}
            <option value='{{ort}}'>{{ort}}</option>
        {{/each}}
    {{/select}}
</select>
```

## Replacement Pattern

Replace with the `{{selectOptions}}` helper:

```handlebars
<select name='system.attribut_0'>
    {{selectOptions
        config.ILARIS.attribute
        selected=item.system.attribut_0
        nameAttr='value'
        labelAttr='label'
    }}
</select>
```

Or for inline options:

```handlebars
<select name='system.aufbewahrungs_ort'>
    {{selectOptions speicherplatz_list selected=item.system.aufbewahrungs_ort}}
</select>
```

## Required Configuration Changes

The system already has configuration objects in `scripts/config.js` starting at line 531:

```javascript
// Configuration objects for select helpers to replace deprecated {{#select}}
let vorteilsgruppen = [...];
ILARIS.vorteilsgruppen = vorteilsgruppen;

let fertigkeitsgruppen = [...];
ILARIS.fertigkeitsgruppen = fertigkeitsgruppen;
```

### Additional Config Needed

Add attribute configuration to `scripts/config.js`:

```javascript
let attribute = [
    { value: 'KO', label: 'KO' },
    { value: 'MU', label: 'MU' },
    { value: 'GE', label: 'GE' },
    { value: 'KK', label: 'KK' },
    { value: 'IN', label: 'IN' },
    { value: 'KL', label: 'KL' },
    { value: 'CH', label: 'CH' },
    { value: 'FF', label: 'FF' },
]
ILARIS.attribute = attribute
```

## Step-by-Step Implementation

### Step 1: Update Config

1. Open `scripts/config.js`
2. Add attribute configuration array after line 531
3. Ensure all options are formatted as `{ value: 'X', label: 'X' }`

### Step 2: Update Item Sheet Templates

For each file, replace the `{{#select}}...{{/select}}` pattern:

#### `templates/sheets/items/fertigkeit.hbs`

- Lines 13-15: attribut_0
- Lines 17-19: attribut_1
- Lines 21-23: attribut_2
- Lines 29-31: gruppe

Replace with:

```handlebars
<select name='system.attribut_0'>
    {{selectOptions
        config.ILARIS.attribute
        selected=item.system.attribut_0
        nameAttr='value'
        labelAttr='label'
    }}
</select>
```

And:

```handlebars
<select name='system.gruppe'>
    {{selectOptions
        config.ILARIS.fertigkeitsgruppen
        selected=item.system.gruppe
        nameAttr='value'
        labelAttr='label'
    }}
</select>
```

#### `templates/sheets/items/uebernatuerlich_fertigkeit.hbs`

- Lines 27-29: attribut_0
- Lines 31-33: attribut_1
- Lines 35-37: attribut_2

Replace similarly with `{{selectOptions config.ILARIS.attribute selected=... nameAttr="value" labelAttr="label"}}`

#### `templates/sheets/items/talent.hbs`

- Line 20: fertigkeit selection

Replace with:

```handlebars
<select name='system.fertigkeit'>
    {{selectOptions fertigkeit_list selected=item.system.fertigkeit}}
</select>
```

#### `templates/sheets/items/base_item_layout.hbs`

- Line 56: aufbewahrungs_ort

Replace with:

```handlebars
<select name='system.aufbewahrungs_ort'>
    {{selectOptions speicherplatz_list selected=item.system.aufbewahrungs_ort}}
</select>
```

#### `templates/sheets/items/uebernatuerlich_talent.hbs`

- Line 17: fertigkeit_ausgewaehlt

Replace with:

```handlebars
{{selectOptions
    item.system.fertigkeit_list
    selected=item.system.fertigkeit_ausgewaehlt
    nameAttr='value'
    labelAttr='label'
}}
```

### Step 3: Update Chat Templates

#### `templates/chat/probendiag_fernkampf.hbs`

- Line 83: manoever.fm_gzss.selected

#### `templates/chat/probendiag_nahkampf.hbs`

- Line 122: manoever.km_gzsl.selected

#### `templates/chat/probendiag_profan.hbs`

- Line 31: talent

For these, you'll need to examine the context to determine the correct options source.

### Step 4: Remove Deprecated Helper Templates

After migration, consider removing these partial templates (if no longer used):

- `templates/helper/select_attribut.hbs`
- `templates/helper/select_fertigkeitsgruppe.hbs`

### Step 5: Test

1. Start Foundry VTT
2. Open each affected item type and verify dropdowns work
3. Check that selected values are preserved
4. Test saving changes
5. Verify chat dialogs function correctly
6. Check browser console for deprecation warnings

## Notes

- The `{{selectOptions}}` helper automatically generates `<option>` elements
- `selected` parameter marks the current value
- `nameAttr` and `labelAttr` specify which object properties to use (default: "value" and "label")
- For simple string arrays, just use `{{selectOptions array selected=value}}`
- The `config` object is available in template context as `config.ILARIS.*`

## Verification Checklist

- [ ] Config updated with attribute array
- [ ] All 13 occurrences replaced in template files
- [ ] No console warnings about deprecated {{select}} helper
- [ ] All dropdowns render correctly
- [ ] Selected values display properly
- [ ] Form submissions work
- [ ] Chat dialogs function correctly
- [ ] Deprecated helper templates removed (optional)
