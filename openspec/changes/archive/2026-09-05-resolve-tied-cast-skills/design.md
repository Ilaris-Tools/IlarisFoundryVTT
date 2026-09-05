## Context

`resolveCastSkillContext` resolves the concrete supernatural skill used by an
automatic spell. It selects the unique highest PW correctly, but returns an
empty choice state when highest-PW candidates tie. The dialog then conditionally
renders a required `Fertigkeit` selector and disables both roll paths until the
user intervenes.

The rule is to resolve that tie automatically with the alphabetically later
skill name. This preserves a concrete skill for result provenance while
removing a value-neutral dialog choice.

## Goals / Non-Goals

**Goals:**

- Resolve every eligible automatic highest-PW tie deterministically.
- Keep explicit item skill selections and unique-highest automatic resolution
  unchanged.
- Remove the tied-skill selector from the casting flow.
- Preserve the concrete resolved skill used by downstream provenance.

**Non-Goals:**

- Changing the meaning or authoring of `fertigkeit_ausgewaehlt`.
- Changing how PW is calculated.
- Adding a user preference for tie-breaking.

## Decisions

### Sort only the tied highest-PW candidates by name

The resolver will derive all eligible candidates as it does today, retain only
the highest-PW candidates, and select the alphabetically later name using a
German locale-aware string comparison. This makes the rule deterministic while
not changing which candidates or PW values are eligible.

The alternative—retaining the required selector—contradicts the stated rule.
Selecting the first item-data order would be deterministic but would couple the
result to compendium authoring order instead of alphabetic order.

### Keep the current context shape but make ties resolved

The tie case will return the chosen `castSkill`, its `basePW`, an empty option
list, and `requiresSelection: false`, matching the unique-highest automatic
case. The dialog’s existing conditional block then naturally remains absent;
the obsolete selection listener and missing-selection roll guard will be
removed because no resolver state can require them.

### UI acceptance contract

The affected surface is the supernatural casting dialog. Its established
top-to-bottom order remains: manoeuvre controls, armed inputs, spell
modifications, then existing zone and result controls. For tied automatic
skills, no `Fertigkeit` section is rendered between armed inputs and spell
modifications, and the existing roll control is immediately available. The
change uses existing dialog styling and must behave in both Foundry light and
dark themes.

## API Surface

- Foundry classes: none.
- Hook events: none.
- `foundry.utils.*` helpers: none. The resolver is local JavaScript data
  selection; no Foundry document, hook, or utility API is needed.

## Risks / Trade-offs

- [Locale collation can differ from a plain code-point comparison] → Use an
  explicit German locale-aware comparison and assert German-name ordering in
  unit tests.
- [Removing the selector can leave dead dialog code] → Remove its rendered
  context, listener, and roll guard together, then cover the no-selector path
  in E2E.

## Migration Plan

No data migration is needed. Existing spells using `auto` immediately use the
new deterministic result when a tie occurs. Rollback restores the former
selection-required branch without modifying stored data.

## Open Questions

None.

## Testing Strategy

- Update the existing pure-function Jest tests in
  `scripts/combat/dialogs/_spec/cast-skill-context.spec.js`; assert a tied
  highest PW selects the alphabetically later German skill and does not require
  selection.
- Update E2E-026's existing prepared tied-skill actor flow. Open the
  supernatural dialog, verify that no `ilaris-cast-skill` control is present,
  and verify the roll control is visible without input. This change needs only
  the existing GM client and world fixture.
- During implementation, create the required change-specific runtime
  verification record and capture the visible dialog path as evidence.
