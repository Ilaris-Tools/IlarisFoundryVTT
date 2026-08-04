## ADDED Requirements

### Requirement: Canonical changelog release structure

The release generator SHALL validate that the current system version has a `## v<major>` heading, a matching `### v<major>.<minor>` release heading, and a breaking-change section using the canonical heading recognized by the generator.

#### Scenario: Valid major and release headings

- **WHEN** `CHANGELOG.md` contains matching major and major.minor headings for `system.json`
- **THEN** generation SHALL continue and identify the release block deterministically

#### Scenario: Missing major heading fails generation

- **WHEN** the current system major has no `## v<major>` heading
- **THEN** generation SHALL fail with the missing-heading location and expected version

#### Scenario: Missing release heading fails generation

- **WHEN** the current system major.minor has no matching `### v<major>.<minor>` heading
- **THEN** generation SHALL fail with the expected release version

### Requirement: Explicit character-import disclaimer

A release with breaking changes SHALL declare `Import erforderlich: Ja` or `Import erforderlich: Nein`. The generator SHALL preserve this status in generated breaking-change data and SHALL render the prominent German re-import disclaimer only for `Ja`.

#### Scenario: Import required is declared

- **WHEN** a breaking-change section declares `Import erforderlich: Ja`
- **THEN** generated output SHALL contain a prominent disclaimer instructing users to re-import characters

#### Scenario: Import not required is declared

- **WHEN** a breaking-change section declares `Import erforderlich: Nein`
- **THEN** generated output SHALL omit the re-import-required disclaimer while retaining the breaking-change details

#### Scenario: Import status is missing

- **WHEN** a breaking-change section lacks the import marker or uses an unsupported value
- **THEN** generation SHALL fail with the accepted marker syntax

### Requirement: Version-specific generated template

The generator SHALL write exactly one current `breaking-changes-<major>.<minor>.hbs` artifact containing HTML converted from the validated release block and SHALL remove stale generated templates according to the existing cleanup policy.

#### Scenario: Current template generated

- **WHEN** generation succeeds for the current system version
- **THEN** the current version-specific Handlebars template SHALL exist and contain enriched-ready HTML

#### Scenario: No stale template remains

- **WHEN** a newer release template is generated
- **THEN** templates for superseded versions SHALL be removed according to the documented build policy
