# Agent Tasks: Inline Styles zu CSS + Class Scoping Refactor

**Start Date**: 2026-02-26  
**Target Completion**: Within this session  
**Autonomy Level**: Full - Execute all tasks sequentially, validate at each phase

---

## Task Overview

This document contains **autonomous coding tasks** for an AI agent to refactor actor sheet styles in the Ilaris system. Follow the sequence exactly. Report status after each phase completion.

**Key Files to Modify**:

- `scripts/actors/styles/actors.css` (merge + refactor)
- `scripts/actors/styles/sidebar.css` (merge + refactor)
- `scripts/actors/templates/held-sidebar.hbs` (remove inline styles)
- `scripts/actors/templates/kreatur.hbs` (remove inline styles)
- `scripts/actors/templates/held/tabs/*.hbs` (remove inline styles)

---

## PHASE 1: Create Consolidated CSS File

### Task 1.1: Create `actor-sheet.css`

**Objective**: Merge `actors.css` + `sidebar.css` into unified file with proper scoping.

**Steps**:

1. Create new file: `scripts/actors/styles/actor-sheet.css`
2. Read all content from `scripts/actors/styles/actors.css`
3. Read all content from `scripts/actors/styles/sidebar.css`
4. Combine both files in following structure:
    - Header comment block (file purpose, date, scope)
    - Section: "Base Actor Sheet Backgrounds"
    - Section: "Hero Window Layout"
    - Section: "Attribute Display Grid"
    - Section: "Icon Overlay (from sidebar.css)"
    - Section: "Lebensleiste & TriState Buttons"
    - Section: "Table / Row Striping (from sidebar.css)"
    - Section: "NEW: Hero Energy Modifiers"
    - Section: "NEW: Hero Tab Styles"
    - Section: "NEW: Kreatur-Specific Styles"
    - Section: "[UNUSED] Legacy Classes"

5. Replace ALL occurrences of:
    - `.ilaris.actor.helden` → `.ilaris.sheet.actor.helden`
    - `.ilaris.actor.kreaturen` → `.ilaris.sheet.actor.kreaturen`
    - `.ilaris.actor` (when both types) → `.ilaris.sheet.actor`

6. Add all NEW CSS classes defined in plan Phase 2.3

7. Mark all unused CSS classes with comment:
    ```css
    /* [UNUSED] - Class "X" defined in CSS but not found in HBS files.
       Review before deletion. */
    ```

**Validation Checklist**:

- [ ] File created at correct path
- [ ] File size > 12KB (proper merge)
- [ ] No syntax errors (valid CSS)
- [ ] All `.ilaris.actor.` replaced with `.ilaris.sheet.actor.`
- [ ] All new hero-\* classes present
- [ ] All kreatur-\* classes present
- [ ] [UNUSED] markers added where appropriate

---

## PHASE 2: Refactor `held-sidebar.hbs` (20 inline styles)

### Task 2.1: Remove inline styles from energy modifier section

**File**: `scripts/actors/templates/held/held-sidebar.hbs`

**Lines to modify**: 45-80 (AsP section + KaP section)

**Current patterns**:

```handlebars
<div style="font-size: 12px">
<label class="onhover" style="margin-right: 0.5em;"><b>AsP:</b></label>
<input style="color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;" />
<span id="ausklappen-view-aspzugekauft" style="display: none; margin-left: 0.5em;">
```

**Replacement strategy**:

- `style="font-size: 12px"` → `class="hero-energy-font-small"`
- `style="margin-right: 0.5em"` → `class="hero-energy-label-spacing"`
- `style="margin-right: 0.1em"` → `class="hero-energy-label-compact"`
- `style="color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;"` → `class="hero-energy-input"`
- `style="display: none; margin-left: 0.5em;"` → `class="hero-energy-expandable"`

**Specific replacements** (in order):

1. Line 45 wrapper div:

    ```handlebars
    <div style="font-size: 12px">
    ```

    Replace with:

    ```handlebars
    <div class="hero-energy-font-small">
    ```

2. Line 47 (AsP label):

    ```handlebars
    <label
        class='onhover'
        data-action='ausklappView'
        data-ausklappentarget='aspzugekauft'
        style='margin-right: 0.5em;'
    ><b>AsP:</b></label>
    ```

    Replace with:

    ```handlebars
    <label
        class='onhover hero-energy-label-spacing'
        data-action='ausklappView'
        data-ausklappentarget='aspzugekauft'
    ><b>AsP:</b></label>
    ```

3. Line 48 (AsP value label):

    ```handlebars
    <label style='margin-right: 0.5em;'>{{actor.system.abgeleitete.asp}}</label>
    ```

    Replace with:

    ```handlebars
    <label class='hero-energy-label-spacing'>{{actor.system.abgeleitete.asp}}</label>
    ```

4. Line 50 (gAsP label):

    ```handlebars
    <label style='margin-right: 0.1em;'><b>gAsP:</b></label>
    ```

    Replace with:

    ```handlebars
    <label class='hero-energy-label-compact'><b>gAsP:</b></label>
    ```

5. Line 51 (gAsP input):

    ```handlebars
    <input
        style='color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;'
        name='system.abgeleitete.gasp'
        value='{{actor.system.abgeleitete.gasp}}'
        type='number'
    />
    ```

    Replace with:

    ```handlebars
    <input
        class='hero-energy-input'
        name='system.abgeleitete.gasp'
        value='{{actor.system.abgeleitete.gasp}}'
        type='number'
    />
    ```

6. Line 53 (AsP\* label):

    ```handlebars
    <label style='margin-right: 0.1em;'><b>AsP*:</b></label>
    ```

    Replace with:

    ```handlebars
    <label class='hero-energy-label-compact'><b>AsP*:</b></label>
    ```

7. Line 54 (AsP\* input):

    ```handlebars
    <input
        style='color: #efe6d8; background-color: transparent; width: 3em; margin-right: 0.5em; padding: 0; padding-left: 4px;'
        name='system.abgeleitete.asp_stern'
        value='{{actor.system.abgeleitete.asp_stern}}'
        type='number'
        data-dtype='Number'
    />
    ```

    Replace with:

    ```handlebars
    <input
        class='hero-energy-input'
        name='system.abgeleitete.asp_stern'
        value='{{actor.system.abgeleitete.asp_stern}}'
        type='number'
        data-dtype='Number'
    />
    ```

8. Line 60 (AsP zugekauft expandable):
    ```handlebars
    <span id="ausklappen-view-aspzugekauft" style="display: none; margin-left: 0.5em;">
    ```
    Replace with:
    ```handlebars
    <span id="ausklappen-view-aspzugekauft" class="hero-energy-expandable">
    ```

### Task 2.2: Continue energy section (KaP) - same pattern

**Lines**: 68-80 (KaP section)

Apply same replacements as Task 2.1 but for KaP instead of AsP:

- Line 68: KaP label `style="margin-right: 0.5em"` → `class="hero-energy-label-spacing"`
- Line 71: gKaP input → `class="hero-energy-input"`
- Line 73: KaP\* label → `class="hero-energy-label-compact"`
- Line 74: KaP\* input → `class="hero-energy-input"`
- Line 80: KaP zugekauft expandable → `class="hero-energy-expandable"`

### Task 2.3: Remove styles from wound/mod sections

**Lines**: 86-109

1. Line 86 wrapper:

    ```handlebars
    <div style="margin-top: 1.5em; font-size: 12px;">
    ```

    Replace with:

    ```handlebars
    <div class="hero-energy-section-spacing">
    ```

2. Line 99 wrapper:

    ```handlebars
    <div style="margin-top: 0.5em; font-size: 12px;">
    ```

    Replace with:

    ```handlebars
    <div class="hero-energy-section-spacing">
    ```

3. Line 107 wrapper:

    ```handlebars
    <div style="margin-top: 0.5em; font-size: 12px;">
    ```

    Replace with:

    ```handlebars
    <div class="hero-energy-section-spacing">
    ```

4. Line 109 (Manueller Mod input):

    ```handlebars

    ```

    Replace with:

    ```handlebars

    ```

### Task 2.4: Sync button wrapper

**Line**: 114

```handlebars
<div style="margin-top: 0.5em; text-align: center;">
```

Replace with:

```handlebars
<div class="hero-sync-button-wrapper">
```

**Validation after held-sidebar.hbs**:

- [ ] No `style="` remaining in file
- [ ] All 20 inline styles converted to classes
- [ ] File loads without syntax errors
- [ ] Energy modifier section displays correctly

---

## PHASE 3: Refactor `kreatur.hbs` (14 inline styles)

### Task 3.1: Header and status block styles

**File**: `scripts/actors/templates/kreatur.hbs`

1. Line 4 (header layout):

    ```handlebars
    <div style="display: flex; justify-content: space-between;">
    ```

    Replace with:

    ```handlebars
    <div class="kreatur-header-layout">
    ```

2. Line 6 (empty style - DELETE):

    ```handlebars

    ```

    Replace with:

    ```handlebars

    ```

3. Line 12 (clear both - DELETE, use flex instead):
    ```handlebars
    <div style='clear: both'></div>
    ```
    Replace with:
    ```handlebars
    <div></div>
    ```

### Task 3.2: Conditional strikethrough (Wundabzüge)

**Line**: 54

**Current**:

```handlebars
<label style="{{#if actor.system.gesundheit.wundenignorieren }}text-decoration:line-through;{{/if}}">{{actor.system.gesundheit.display}}</label>
```

**Strategy**: Add class conditionally

```handlebars
<label class="{{#if actor.system.gesundheit.wundenignorieren}}strikethrough{{/if}}">{{actor.system.gesundheit.display}}</label>
```

**Add to actor-sheet.css**:

```css
.ilaris.sheet.actor.kreaturen .strikethrough {
    text-decoration: line-through;
}
```

### Task 3.3: HR styling

**Line**: 73

```handlebars
<hr
    style='width: 100%; padding-top: 1px; padding-bottom: 1px; margin-top: 1px; margin-bottom: 1px; border-top: 1px solid darkred; border-bottom: 0px;'
/>
```

Replace with:

```handlebars
<hr class='kreatur-divider-red' />
```

### Task 3.4: Attributes section (disability opacity)

**Line**: 128

```handlebars

```

Replace with:

```handlebars

```

### Task 3.5: Input width for attributes

**Line**: 132

```handlebars
<input
    name='system.attribute.{{key}}.pw'
    type='text'
    value='{{attribut.pw}}'
    data-dtype='Number'
    style='width: 30px;'
/>
```

Replace with:

```handlebars
<input
    class='kreatur-input-narrow'
    name='system.attribute.{{key}}.pw'
    type='text'
    value='{{attribut.pw}}'
    data-dtype='Number'
/>
```

### Task 3.6: Kampfwerte float right

**Line**: 145

```handlebars
<div class="flexrow" style="float: right">
```

Replace with:

```handlebars
<div class="flexrow kreatur-kampfwerte-float-right">
```

### Task 3.7: Kampfwerte section disability

**Line**: 153

```handlebars

```

Replace with:

```handlebars

```

### Task 3.8: Kampfwerte input width

**Line**: 158

```handlebars
<input
    name='system.kampfwerte.{{key}}'
    type='text'
    value='{{obj}}'
    data-dtype='Number'
    style='width: 30px;'
/>
```

Replace with:

```handlebars
<input
    class='kreatur-input-narrow'
    name='system.kampfwerte.{{key}}'
    type='text'
    value='{{obj}}'
    data-dtype='Number'
/>
```

### Task 3.9: Select dropdowns

**Lines**: 386, 390

```handlebars
<select name="system.additemtype" style="max-width: 150px;">
```

Replace with:

```handlebars
<select class="kreatur-select-narrow" name="system.additemtype">
```

(Do this for both occurrences)

**Validation after kreatur.hbs**:

- [ ] No `style="` remaining in file
- [ ] All 14+ inline styles converted
- [ ] Conditional strikethrough working
- [ ] File loads without errors

---

## PHASE 4: Refactor `held/tabs/attribute.hbs` (4 inline styles)

### Task 4.1: Tab container layout

**File**: `scripts/actors/templates/held/tabs/attribute.hbs`

**Line**: 3

```handlebars
<div style="display: flex; gap: 1em; align-items: flex-start;">
```

Replace with:

```handlebars
<div class="hero-tab-container-flex">
```

### Task 4.2: Table styling

**Line**: 6

```handlebars
<table class="table" style="font-size:10pt; border-collapse: collapse; width: auto; table-layout: auto;">
```

Replace with:

```handlebars
<table class="table hero-table-compact">
```

### Task 4.3: Row transparency

**Line**: 17

```handlebars
<tr style="background-color: rgba(255, 255, 255, 0);">
```

Replace with:

```handlebars
<tr class="hero-table-row-transparent">
```

### Task 4.4: Input compact style

**Line**: 24

```handlebars
<input
    name='system.attribute.{{attributPair.[0]}}.wert'
    value='{{attributPair.[1].wert}}'
    type='number'
    step='1'
    data-dtype='Number'
    style='width: 4em; text-align: center;'
/>
```

Replace with:

```handlebars
<input
    class='hero-input-compact'
    name='system.attribute.{{attributPair.[0]}}.wert'
    value='{{attributPair.[1].wert}}'
    type='number'
    step='1'
    data-dtype='Number'
/>
```

**Validation**:

- [ ] 4 inline styles removed
- [ ] file loads correctly

---

## PHASE 5: Refactor `held/tabs/fertigkeiten.hbs` (10+ inline styles)

### Task 5.1: Button spacing

**File**: `scripts/actors/templates/held/tabs/fertigkeiten.hbs`

**Line**: 7

```handlebars
<a data-action="itemCreate" data-itemclass="talent" style="margin-left: 1em;"><i class="fas fa-plus"></i>
```

Replace with:

```handlebars
<a data-action="itemCreate" data-itemclass="talent" class="hero-button-spacing"><i class="fas fa-plus"></i>
```

### Task 5.2: Fixed width columns

**Lines**: 19, 36

**Line 19**:

```handlebars
<th style='flex-basis: 40px; width: 40px;'>PW</th>
```

Replace with:

```handlebars
<th class='hero-table-col-fixed-40'>PW</th>
```

**Line 36** (in tbody):

```handlebars
<td data-action="rollable" class="flex-fest-var onhover" data-rolltype="profan_fertigkeit_pw"
    data-fertigkeit="{{profert.name}}" data-pw="{{profert.system.pw}}" style="flex-basis: 40px;">
```

Replace with:

```handlebars
<td data-action="rollable" class="flex-fest-var onhover hero-table-col-fixed-40" data-rolltype="profan_fertigkeit_pw"
    data-fertigkeit="{{profert.name}}" data-pw="{{profert.system.pw}}">
```

### Task 5.3: Expandable rows

**Line**: 74 (hidden row)

```handlebars
<tr id="ausklappen-view-{{profert.id}}" style="display:none;">
```

Replace with:

```handlebars
<tr id="ausklappen-view-{{profert.id}}" class="hero-expandable-row-hidden">
```

### Task 5.4: Expandable cell styling

**Line**: 77

```handlebars
<td colspan="7" style="padding: 0.5em 1em; background: #f9f9f9;">
```

Replace with:

```handlebars
<td colspan="7" class="hero-expandable-row-cell">
```

### Task 5.5: Expandable header

**Line**: 80

```handlebars
<div style="display: flex; gap: 1em; font-weight: bold; margin-bottom: 0.2em;">
```

Replace with:

```handlebars
<div class="hero-expandable-header">
```

### Task 5.6: Expandable values

**Line**: 86

```handlebars
<div style="display: flex; gap: 1em; margin-bottom: 0.8em;">
```

Replace with:

```handlebars
<div class="hero-expandable-values">
```

### Task 5.7: Preformatted text

**Line**: 91

```handlebars
<label style='white-space: pre-line;'>{{{profert.system.text}}}</label>
```

Replace with:

```handlebars
<label class='hero-text-preformatted'>{{{profert.system.text}}}</label>
```

### Task 5.8: Talent section spacing

**Line**: 97

```handlebars
<div style="margin-top: 1em;">
```

Replace with:

```handlebars
<div class="hero-section-spacing">
```

### Task 5.9: Talent item separator

**Line**: 102

```handlebars
<div style="margin-bottom: 0.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em;">
```

Replace with:

```handlebars
<div class="hero-talent-item">
```

### Task 5.10: Action buttons float

**Line**: 106, 109

**Line 106** (edit button):

```handlebars
<a data-action="itemEdit" class="icon-small" data-itemclass="talent" data-itemid="{{protal.id}}"
    style="float: right; margin-left: 0.3em;">
```

Replace with:

```handlebars
<a data-action="itemEdit" class="icon-small hero-action-float-right" data-itemclass="talent" data-itemid="{{protal.id}}">
```

**Line 109** (delete button):

```handlebars
<a data-action="itemDelete" class="icon-small" data-itemclass="talent" data-itemid="{{protal.id}}"
    style="float: right;">
```

Replace with:

```handlebars
<a data-action="itemDelete" class="icon-small hero-action-float-left" data-itemclass="talent" data-itemid="{{protal.id}}">
```

### Task 5.11: Free skills table

**Line**: 142

```handlebars
<table class="table" style="font-size:10pt; width: 100%; border-collapse: collapse; margin-top: 0.5em;">
```

Replace with:

```handlebars
<table class="table hero-table-free-fertigkeiten">
```

**Validation**:

- [ ] All 10+ inline styles removed
- [ ] Expandable rows working

---

## PHASE 6: Refactor `held/tabs/kampf.hbs` (10+ inline styles)

### Task 6.1: Combat mod float

**File**: `scripts/actors/templates/held/tabs/kampf.hbs`

**Line**: 4

```handlebars
<div class="flexrow" style="float: right">
```

Replace with:

```handlebars
<div class="flexrow hero-kampf-mod-float-right">
```

### Task 6.2: Combat style container

**Line**: 10

```handlebars
<div style="display: flex; align-items: center; gap: 10px;">
```

Replace with:

```handlebars
<div class="hero-kampf-style-container">
```

### Task 6.3: Checkbox container

**Line**: 14

```handlebars
<label style="display: flex; align-items: center; gap: 5px;">
```

Replace with:

```handlebars
<label class="hero-kampf-checkbox-container">
```

### Task 6.4: Alert warning box

**Line**: 19-21

```handlebars
<div style="margin-top: 8px; padding: 8px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
    <i class="fas fa-exclamation-triangle" style="color: #dc3545; margin-right: 5px;"></i>
```

Replace with:

```handlebars
<div class="hero-kampf-alert-warning">
    <i class="fas fa-exclamation-triangle hero-kampf-alert-icon"></i>
```

### Task 6.5: Table full width (Nahkampfwaffen)

**Line**: No specific inline style on first table - SKIP if not found

### Task 6.6: Fernkampfwaffen table

**Line**: 167

```handlebars
<table class="table" style="width: 100%; border-collapse: collapse;">
```

Replace with:

```handlebars
<table class="table hero-table-full-width">
```

### Task 6.7: Rüstung table

**Line**: 218

```handlebars
<table class="table" style="width: 100%; border-collapse: collapse;">
```

Replace with:

```handlebars
<table class="table hero-table-full-width">
```

### Task 6.8: Expandable rows in combat tables

Find and replace all:

```handlebars
<tr id="ausklappen-view-{{...}}" style="display: none">
```

With:

```handlebars
<tr id="ausklappen-view-{{...}}" class="hero-expandable-row-hidden">
```

**Validation**:

- [ ] float: right replaced
- [ ] Alert styling correct
- [ ] Tables full width applied

---

## PHASE 7: Refactor remaining tab files

### Task 7.1: `held/tabs/inventar.hbs`

**Status**: Report if no inline styles found (expected)

### Task 7.2: `held/tabs/notes.hbs`

**Status**: Check for inline styles, report findings

### Task 7.3: `held/tabs/uebernatuerlich.hbs`

**Status**: Check for inline styles, report findings

### Task 7.4: `held/tabs/effekte.hbs`

**Status**: Check for inline styles, report findings

### Task 7.5: `held/tabs/auslagerung.hbs`

**Status**: Check for inline styles, report findings

---

## PHASE 8: CSS Cleanup and Final Validation

### Task 8.1: Mark unused CSS classes

In `scripts/actors/styles/actor-sheet.css`:

Search for classes NOT found in HBS files and mark with:

```css
/* [UNUSED] - Review candidate: .classname
   Not found in HBS files. Delete if no external dependencies exist. */
```

**Common unused candidates**:

- `.attribute-grid`
- `.attribute-wrapper`
- `.attribute-number`
- Any standalone selectors without `.ilaris.sheet.actor` prefix

### Task 8.2: Verify no duplicate definitions

- [ ] No class defined more than once in actor-sheet.css
- [ ] All scoped correctly with `.ilaris.sheet.actor.*`

### Task 8.3: CSS syntax validation

Run CSS through linter (validate format):

- [ ] No syntax errors
- [ ] Proper nesting (if SCSS)
- [ ] All selectors properly structured

---

## PHASE 9: Final Testing & Reporting

### Task 9.1: Visual inspection checklist

**Helden Sheet** - Open in Foundry:

- [ ] Header renders correctly
- [ ] Sidebar displays all attributes and skills icons
- [ ] Energy modifiers (AsP, KaP) styled correctly
- [ ] Tab navigation works
- [ ] Attribute tab: table layout correct, fonts sized properly
- [ ] Fertigkeiten tab: expandable rows toggle correctly
- [ ] Kampf tab: alert messages styled correctly, tables full width
- [ ] All text colors and spacing match original
- [ ] No broken layouts

**Kreatur Sheet**:

- [ ] Header with image positioned correctly
- [ ] Status block (Wunden, Energie) reads cleanly
- [ ] Attribute section: inputs sized correctly
- [ ] Kampfwerte section: float right alignment correct
- [ ] All dividers (red HR) display
- [ ] Disabled sections (opacity) look correct

### Task 9.2: Code review checklist

- [ ] 0 `style="` attributes in any HBS file
- [ ] All inline styles moved to CSS
- [ ] All classes in HBS have `.ilaris.sheet.actor.*` scoping in CSS
- [ ] `actor-sheet.css` created and properly merged
- [ ] Old `actors.css` and `sidebar.css` files DELETE (or archive)

### Task 9.3: Generate completion report

Create summary:

```
## Completion Report

**Phase 1**: CSS Consolidation ✅
- actor-sheet.css created with X lines
- Y classes rescoped with .ilaris.sheet.actor.*

**Phase 2-6**: HBS Refactoring ✅
- held-sidebar.hbs: 20 inline styles removed
- kreatur.hbs: 14 inline styles removed
- attribute.hbs: 4 inline styles removed
- fertigkeiten.hbs: 10+ inline styles removed
- kampf.hbs: 10+ inline styles removed
Total: ~60 inline styles eliminated

**Phase 7**: Other tabs ✅
- [List any findings]

**Phase 8**: CSS Cleanup ✅
- [N] classes marked as [UNUSED]

**Phase 9**: Testing ✅
- Visual tests: PASSED
- Code review: PASSED

**Files Modified**:
- Created: scripts/actors/styles/actor-sheet.css
- Deleted: scripts/actors/styles/actors.css (KEEP FOR REFERENCE)
- Deleted: scripts/actors/styles/sidebar.css (KEEP FOR REFERENCE)
- Modified: [list all HBS files]

**Status**: READY FOR PRODUCTION
```

---

## Execution Notes

**Critical Reminders**:

1. **Always include 3-5 lines of context** when doing replacements
2. **Batch multiple replacements** for efficiency
3. **Validate after each phase** before moving to next
4. **Test in Foundry** - don't assume CSS works
5. **Keep git history** - don't delete old CSS files immediately
6. **Report blockers immediately** - don't proceed if something breaks

**Scoping Rule (CRITICAL)**:

- ALL actor sheet classes must be `.ilaris.sheet.actor.helden` or `.ilaris.sheet.actor.kreaturen` or `.ilaris.sheet.actor`
- NO Exception to this rule

**Success Criteria**:
✅ 0 inline styles remaining  
✅ All classes properly scoped  
✅ CSS consolidated and organized  
✅ Visual tests passing  
✅ Code review passing
