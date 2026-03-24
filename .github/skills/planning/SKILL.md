---
name: 'planning'
description: 'Structured task decomposition and planning for the Ilaris FoundryVTT system.'
---

# Planning Skill

A reusable skill for decomposing any user request into an executable plan with validation criteria.

## When to Use

- User requests a new feature, refactor, or complex change
- Multiple files or subsystems are affected
- The request is ambiguous and needs structured breakdown

## Step Sequence

### Step 1: Parse Intent

- Read the user's request carefully.
- Identify the core goal and any secondary goals.
- Note constraints and preferences.

### Step 2: Gather Context

- Check `.agents/CODEBASE_ARCHITECTURE.md` for relevant directories.
- Check `.agents/PATTERNS_AND_EXAMPLES.md` for similar past implementations.
- Check `template.json` if data models are involved.
- Check the Foundry VTT API docs if Hook/Document changes are needed.

### Step 3: Identify Affected Areas

List all files, directories, and subsystems that will be affected:

- Scripts (`scripts/`)
- Templates (`.hbs`)
- Styles (`.css`)
- Compendium data (`comp_packs/_source/`)
- Configuration (`system.json`, `template.json`)
- Tests (`_spec/`)
- Documentation (`docs/`)

### Step 4: Decompose into Steps

Break the work into atomic, ordered steps. Each step should:

- Be completable by a single agent in one pass
- Have clear input requirements
- Produce a verifiable output
- Take no more than ~100 lines of code change

### Step 5: Define Validation

For each step, define:

- How to verify it worked (`npm test`, `npm run lint`, manual check)
- What the expected output looks like
- What could go wrong and how to detect it

### Step 6: Produce Plan

Output using the Implementation Plan Template from `.agents/HANDOFFS_AND_STANDARDS.md`.

## Quality Criteria

A good plan:

- [ ] Has no ambiguous steps
- [ ] Each step has exactly one responsible agent/specialist
- [ ] Validation criteria are testable
- [ ] Dependencies between steps are explicit
- [ ] Can be executed without reprompting the planner
