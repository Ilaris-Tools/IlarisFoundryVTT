## Purpose

System architecture conventions: ES module structure, build system, AppV2 patterns, file organization, and agent instructions.

## Requirements

### Requirement: ES module architecture

The system SHALL use ES modules throughout, with `system.json` declaring all entry points in the `esmodules` array.

#### Scenario: Entry points declared in manifest

- **WHEN** `system.json` is parsed
- **THEN** the `esmodules` array SHALL list all JavaScript entry points for the system

#### Scenario: Feature hooks aggregated

- **WHEN** `scripts/core/hooks.js` is loaded
- **THEN** it SHALL import and re-export hooks from all feature directories (`actors/hooks.js`, `items/hooks.js`, `combat/hooks.js`, etc.)

### Requirement: File structure conventions

The system SHALL organize code by feature in `scripts/<feature>/` directories, each containing `hooks.js`, `templates/`, `styles/`, and `_spec/` subdirectories.

#### Scenario: Feature directory structure

- **WHEN** examining any feature directory under `scripts/`
- **THEN** it SHALL follow the pattern of having `hooks.js` as the entry point, with supporting files organized in subdirectories

### Requirement: Build system

The system SHALL provide npm scripts for development workflow: `npm test` (Jest), `npm run lint` (ESLint + Prettier), `npm run pack-all` (compendium packing), and `npm run start-foundry`.

#### Scenario: Tests run with Jest

- **WHEN** `npm test` is executed
- **THEN** Jest SHALL run all tests in `_spec/` directories using the configuration in `jest.config.mjs`

#### Scenario: Lint checks code style

- **WHEN** `npm run lint` is executed
- **THEN** ESLint and Prettier SHALL check all JavaScript files for style compliance

#### Scenario: Compendiums packed from source

- **WHEN** `npm run pack-all` is executed
- **THEN** all `_source/` JSON in compendium packs SHALL be packed into LevelDB format

#### Scenario: Pre-commit hooks enforce quality

- **WHEN** a git commit is made
- **THEN** Husky + lint-staged SHALL run ESLint and Prettier on staged files

### Requirement: AppV2 sheet pattern

All actor and item sheets SHALL use the AppV2 pattern via `HandlebarsApplicationMixin(ActorSheetV2)` or `HandlebarsApplicationMixin(ItemSheetV2)` with static `DEFAULT_OPTIONS`, `PARTS`, and `TABS` properties.

#### Scenario: Sheet class declares static options

- **WHEN** examining any sheet class
- **THEN** it SHALL have `static DEFAULT_OPTIONS` defining its AppV2 configuration

#### Scenario: Sheet class declares template parts

- **WHEN** examining any sheet class
- **THEN** it SHALL have `static PARTS` mapping part IDs to Handlebars template paths

#### Scenario: Sheet class declares tabs (if multi-tab)

- **WHEN** examining a multi-tab sheet class
- **THEN** it SHALL have `static TABS` defining tab groups and their initial tab

### Requirement: V13 → V14 migration complete

The system SHALL have completed migration from Foundry V13 to V14, including AppV2 sheet conversion, deprecated API removal, and TypeDataModel registration.

#### Scenario: No V13 API usage remains

- **WHEN** searching the codebase for deprecated V13 APIs
- **THEN** no references to V13-only APIs SHALL exist

#### Scenario: All sheets are AppV2

- **WHEN** examining all sheet classes
- **THEN** every sheet SHALL extend AppV2 base classes (not V1 Application)

### Requirement: Agent instructions

The system SHALL maintain agent instruction files in `.github/` for AI-assisted development workflows.

#### Scenario: Repository-wide copilot instructions exist

- **WHEN** the repository is opened in VS Code with Copilot
- **THEN** `.github/copilot-instructions.md` SHALL provide project context and coding conventions

#### Scenario: Path-specific instructions exist

- **WHEN** working in specific directories (compendiums, docs, scripts)
- **THEN** corresponding `.github/instructions/*.instructions.md` files SHALL apply

#### Scenario: Skill files enable specialized workflows

- **WHEN** specific tasks are requested (planning, review, OpenSpec changes)
- **THEN** `.github/skills/*/SKILL.md` files SHALL enable the corresponding agent skills

### Requirement: CSS organization

The system SHALL organize CSS by feature, with per-feature `styles/` directories and a global `styles/` directory for shared styles.

#### Scenario: Feature CSS in feature directory

- **WHEN** a feature needs custom styles
- **THEN** its CSS SHALL be located in `scripts/<feature>/styles/`

#### Scenario: Global CSS for shared styles

- **WHEN** styles apply across multiple features
- **THEN** they SHALL be located in the root `styles/` directory

## Data Model

N/A — Architecture defines structural conventions, not data.

## Cross-References

All other capability specs follow the architecture conventions defined here.
