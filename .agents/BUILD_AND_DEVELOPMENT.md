# Build & Development — Ilaris FoundryVTT System

## npm Scripts

All available scripts from `package.json`:

| Script                      | Command                               | Purpose                                         |
| --------------------------- | ------------------------------------- | ----------------------------------------------- |
| `test`                      | `npm test`                            | Run Jest test suite                             |
| `lint`                      | `npm run lint`                        | ESLint with auto-fix                            |
| `prettier`                  | `npm run prettier`                    | Format all files with Prettier                  |
| `prepare`                   | `npm run prepare`                     | Install Husky git hooks (runs on `npm install`) |
| `optimize-svgs`             | `npm run optimize-svgs`               | Remove unnecessary SVG metadata                 |
| `pack-all`                  | `npm run pack-all`                    | Build all compendium packs from `_source/` JSON |
| `foundry:lifecycle`         | `npm run foundry:lifecycle -- Status` | Local Foundry E2E lifecycle facade              |
| `foundry:env`               | `npm run foundry:env`                 | Opt-in manifest-driven remote E2E setup         |
| `foundry:ctl`               | `npm run foundry:ctl -- Status`       | Control the dedicated remote E2E server         |
| `generate-breaking-changes` | `npm run generate-breaking-changes`   | Generate breaking changes report                |
| `start-foundry`             | `npm run start-foundry`               | Pack-all + launch Foundry VTT                   |

## Development Workflow

### First-Time Setup

```bash
# 1. Clone to Foundry data directory
git clone https://github.com/Ilaris-Tools/IlarisFoundryVTT.git
# OR: clone into foundrydata/Data/systems/Ilaris

# 2. Install dependencies
npm install

# 3. Verify tests pass
npm test

# 4. Verify linting passes
npm run lint

# 5. Build compendium packs
npm run pack-all
```

### Daily Development Cycle

```bash
# 1. Pull latest changes
git pull

# 2. Install any new dependencies
npm install

# 3. Make changes to code

# 4. Run tests for affected area
npm test -- --testPathPattern="scripts/actors"  # Example: test only actors

# 5. Run linter
npm run lint

# 6. If compendium data changed:
npm run pack-all

# 7. Commit (Husky pre-commit runs eslint + prettier on staged files)
git add .
git commit -m "feat: description"
```

### VS Code Tasks

Two VS Code tasks are available via Terminal → Run Task:

| Task              | Purpose                                    |
| ----------------- | ------------------------------------------ |
| **Setup IDE**     | Configures VS Code environment             |
| **Start foundry** | Packs compendiums and launches Foundry VTT |

**Start foundry** requires a `developer.env` file. See `docs/develop/tools.md` for configuration.

## Testing

### Framework

- **Jest** with Babel transforms for ES modules
- Config: `jest.config.mjs`
- Setup: `jest.setup.js` (mocks Foundry VTT globals)
- Babel: `babel.config.cjs`

### Test Location

Tests are colocated with feature code in `_spec/` directories:

```
scripts/actors/_spec/
scripts/items/_spec/
scripts/combat/_spec/
scripts/core/_spec/
scripts/dice/_spec/
scripts/waffe/_spec/
```

### Running Tests

```bash
# All tests
npm test

# Specific test file
npx jest scripts/actors/_spec/actor.spec.js

# Tests matching a pattern
npm test -- --testPathPattern="waffe"

# With coverage
npm test -- --coverage
```

### Writing Tests

```js
// scripts/actors/_spec/example.spec.js
describe('HeldenSheet', () => {
    it('should prepare context with config', () => {
        // Foundry globals are mocked in jest.setup.js
        expect(CONFIG.ILARIS).toBeDefined()
    })
})
```

## Linting & Formatting

### ESLint

- Config: `.eslintrc` or ESLint config in `package.json`
- Runs: `npm run lint` (with `--fix`)
- Checks: Code quality, potential bugs, style issues

### Prettier

- Config: `.prettierrc` or Prettier config
- Runs: `npm run prettier` (with `--write`)
- Checks: Formatting (indentation, quotes, semicolons, line length)

### Pre-commit (Husky)

- Configured in `.husky/pre-commit`
- Runs `lint-staged` on staged files
- Can be bypassed with `git commit -n`
- Manual run: `npx lint-staged`

```bash
# Manual linting of specific files
npx eslint myfile.js
npx eslint --fix myfile.js
npx prettier --check myfile.css
npx prettier --write myfile.css
```

## Compendium Pack Tools

### pack-all (`utils/pack-all.js`)

Packs all `_source/` JSON directories into LevelDB format that Foundry can read.

```bash
npm run pack-all
```

**When to run**: After any change to `comp_packs/*/_source/*.json` files.

### Other Migration Tools

| Script                                       | Purpose                                           |
| -------------------------------------------- | ------------------------------------------------- |
| `utils/update-compendium-stats.mjs`          | Updates creature statistics from external sources |
| `utils/migrate-compendium-eigenschaften.mjs` | Migrates weapon property data to new schema       |
| `utils/migrate-waffen-source.mjs`            | Migrates weapon source data                       |
| `utils/migrate-waffen-pack.js`               | Migrates weapon pack data                         |
| `utils/consolidate-eigenschaften.mjs`        | Consolidates weapon property entries              |
| `utils/update-creature-items.js`             | Updates creature item data                        |

## Debugging

### In Foundry VTT

- Open browser DevTools (F12) while Foundry is running.
- System entry point: `scripts/core/hooks.js`
- Use `console.log()` or `debugger` statements in code.
- Foundry API explorer in browser console: `game.system`, `game.actors`, `game.items`.

### In Tests

- Run Jest with `--verbose` for detailed output.
- Use `console.log()` in test files.
- Check `jest.setup.js` for mock configuration if tests fail on Foundry globals.

## Dependencies

### Dev Dependencies (from `package.json`)

| Package                                                      | Purpose                                        |
| ------------------------------------------------------------ | ---------------------------------------------- |
| `@babel/core`, `@babel/preset-env`                           | Babel for Jest ES module transforms            |
| `@foundryvtt/foundryvtt-cli`                                 | Foundry VTT CLI for pack management            |
| `babel-jest`                                                 | Jest Babel integration                         |
| `eslint`, `eslint-config-prettier`, `eslint-plugin-prettier` | Linting                                        |
| `husky`                                                      | Git hooks                                      |
| `jest`                                                       | Testing framework                              |
| `lint-staged`                                                | Pre-commit staged file linting                 |
| `lodash`                                                     | Utility library                                |
| `marked`                                                     | Markdown parser (for changelog)                |
| `nedb`                                                       | Embedded database (for legacy pack operations) |
| `prettier`                                                   | Code formatter                                 |
| `svgo`                                                       | SVG optimization                               |
| `xml2js`                                                     | XML parsing (for Sephrasto import)             |

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow                  | Trigger | Purpose                                      |
| ------------------------- | ------- | -------------------------------------------- |
| `codestyle.yml`           | PR/push | ESLint + Prettier checks                     |
| `test.yml`                | PR/push | Jest test suite                              |
| `build-packs.yml`         | Release | Build + GitHub Release + Foundry VTT publish |
| `deploy.yml`              | Release | Deployment                                   |
| `test-foundry-deploy.yml` | Manual  | Test deployment process                      |
