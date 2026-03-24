---
name: 'foundry-setup'
description: 'Environment bootstrap and verification for the Ilaris FoundryVTT development setup.'
---

# Foundry Setup Skill

A reusable skill for bootstrapping and verifying the Ilaris development environment.

## When to Use

- First-time setup of the development environment
- After cloning the repository
- When build/test commands fail unexpectedly
- When onboarding a new developer or agent

## Prerequisites

- Node.js >= 18 installed
- Git repository cloned to a Foundry VTT `Data/systems/` directory
- (Optional) Foundry VTT installed for local testing

## Setup Steps

### Step 1: Verify Environment

```bash
node --version    # Expect: v18+ or v20+
npm --version     # Expect: v9+
git status        # Expect: clean working tree or known changes
```

### Step 2: Install Dependencies

```bash
npm install
```

**Verify**: `node_modules/` directory exists and contains `@foundryvtt/foundryvtt-cli`.

**If it fails**:

1. Delete `node_modules/` and `package-lock.json`
2. Run `npm install` again
3. If still failing, check Node.js version compatibility

### Step 3: Run Tests

```bash
npm test
```

**Verify**: All tests pass. Check output for number of test suites and tests.

**If it fails**:

- Check `jest.setup.js` for mock configuration issues
- Ensure `babel.config.cjs` is present (required for ES module transforms)
- Look at specific test file errors — they live in `_spec/` dirs

### Step 4: Run Linter

```bash
npm run lint
```

**Verify**: No errors. Warnings are acceptable.

**If it fails**:

- `npm run lint` auto-fixes most issues
- `npm run prettier` fixes formatting
- Remaining issues need manual review

### Step 5: Build Compendium Packs

```bash
npm run pack-all
```

**Verify**: All packs in `comp_packs/` have updated LevelDB files.

**If it fails**:

- Check that `_source/` JSON files are valid JSON
- Verify `@foundryvtt/foundryvtt-cli` is installed
- Check for file permission issues on `comp_packs/` directories

### Step 6: (Optional) Launch Foundry

```bash
npm run start-foundry
```

**Prerequisite**: Create `developer.env` from template at `.vscode/tasks-scripts/start-foundry/developer.template.env`.

**Windows `developer.env` example**:

```cmd
REM FoundryVTT Configuration
set PATH_TO_FOUNDRY=C:\Program Files\Foundry Virtual Tabletop\
set FILE_TO_START_FOUNDRY=Foundry Virtual Tabletop.exe
```

## Error Patterns & Recovery

| Symptom                         | Likely Cause               | Fix                                  |
| ------------------------------- | -------------------------- | ------------------------------------ |
| `Cannot find module`            | Missing npm install        | `npm install`                        |
| `SyntaxError: Unexpected token` | Babel not configured       | Check `babel.config.cjs`             |
| `fvtt is not recognized`        | CLI not installed          | `npm install` (it's a devDependency) |
| `ENOENT: no such file` on pack  | Missing `_source/` data    | Check file paths in JSON             |
| Jest mock errors                | Foundry globals not mocked | Check `jest.setup.js`                |
| `LOCK` file errors in packs     | Stale lock files           | Delete `.ldb` LOCK files, retry      |

## Verification Checklist

```markdown
- [ ] Node.js >= 18 installed
- [ ] `npm install` completed successfully
- [ ] `npm test` — all tests pass
- [ ] `npm run lint` — no errors
- [ ] `npm run pack-all` — all packs built
- [ ] `comp_packs/` directories contain `.ldb` files
- [ ] (Optional) `developer.env` configured for Foundry launch
```
