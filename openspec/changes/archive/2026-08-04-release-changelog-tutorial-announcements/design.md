## Context

The system currently reads the system version at `ready`, fetches a generated `breaking-changes-<major>.<minor>.hbs` file, enriches it, and displays a Foundry `DialogV2`. The generator uses regular expressions over free-form `CHANGELOG.md`; it does not enforce the top-level Foundry-major heading, distinguish an informational breaking change from a character-import requirement, or produce a chat announcement. The tutorials themselves are already covered by existing work; this change only promotes and links to them during a major change.

The implementation must remain compatible with Foundry VTT v14, German user-facing content, the existing CI build, and the current per-user acknowledgement setting.

## Goals / Non-Goals

**Goals:**

- Define and validate a deterministic changelog release shape: major header, release header, breaking-change section, and import-required marker.
- Continue generating static HTML templates at build time, while making generation fail for malformed release metadata.
- Show an explicit re-import disclaimer only when the release declares that character import is required.
- Post one persistent major-release card to world chat, initiated by a GM, with links to the already-maintained tutorial targets.
- Keep per-user dialog acknowledgement and per-world chat-announcement state independent and idempotent.
- Cover parser, state transitions, and startup behavior with unit and E2E tests.

**Non-Goals:**

- Automatically migrating or re-importing Actor documents.
- Replacing `CHANGELOG.md` with a remote service or adding a runtime network dependency.
- Posting a chat message for every minor or patch release.
- Expanding, authoring, or restructuring tutorial prose.
- Importing tutorial documents from external sites.

## Decisions

### 1. Use explicit release metadata in Markdown

Keep `CHANGELOG.md` as the human-editable source of truth, but require a canonical structure:

```markdown
## v14

### v14.1

#### Breaking Changes

Import erforderlich: Ja
...
```

The generator validates the major header and release header against `system.json`, accepts a normalized `Import erforderlich: Ja|Nein` marker, and emits the marker plus the warning content into the generated template. A structured JSON file was considered, but rejected because it would duplicate release notes and make the public changelog less convenient to edit.

### 2. Separate import-required status from breaking-change presence

The parser returns release metadata such as `{ version, majorVersion, hasBreakingChanges, importRequired, markdown }`. A breaking section can exist without requiring character import; the dialog and chat card use `importRequired` to decide whether to show the prominent re-import disclaimer. Missing or contradictory markers are validation errors for a breaking section rather than silently guessing.

### 3. Keep generated assets static

`utils/generate-breaking-changes.js` continues to convert Markdown with `marked` and write `scripts/changelog/templates/breaking-changes-<major>.<minor>.hbs`. CI keeps running the generator before packaging. Runtime code fetches only the packaged static template; no Markdown parser or external tutorial request is added to Foundry.

### 4. Announce major releases through a world ChatMessage

On `ready`, only the active GM with a usable world creates the announcement. The code compares the current Foundry-major release with a new `lastAnnouncedMajorRelease` setting, creates one `ChatMessage` containing enriched tutorial/changelog links, and updates the setting only after successful creation. Other users consume the persisted message and do not create duplicates. A setting-based idempotency check was chosen over message searches because it is deterministic and avoids scanning or mutating unrelated chat history.

### 5. Preserve existing acknowledgement semantics

`lastSeenBreakingChangesVersion` remains the per-user acknowledgement key for the warning dialog. It continues to use the generated major.minor template identity so patch releases do not repeatedly show identical content. The new major-announcement setting uses only the first version component and is not coupled to dialog dismissal.

### 6. Tutorial links reference existing maintained content

The major release announcement uses the existing tutorial URLs/labels already maintained by the system documentation or tutorial feature. The release entry selects or references those targets; it does not contain tutorial prose. A missing target is a release-configuration error, but creating or expanding tutorial content is outside this change.

## API Surface

- `foundry.documents.ChatMessage.create(data)` creates the persistent announcement; [ChatMessage API](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html).
- `foundry.applications.api.DialogV2` remains the breaking-change dialog base; [DialogV2 API](https://foundryvtt.com/api/v14/classes/foundry.applications.api.DialogV2.html).
- `Hooks.once("ready", callback)` remains the startup integration point; [Hooks API](https://foundryvtt.com/api/v14/classes/foundry.helpers.Hooks.html).
- `foundry.applications.ux.TextEditor.implementation.enrichHTML` enriches generated HTML and chat content; [TextEditor API](https://foundryvtt.com/api/v14/classes/foundry.applications.ux.TextEditor.html).
- `foundry.utils.isNewerVersion` is reused for release-version comparisons; `foundry.utils.deepClone` is used for safe parser/result handling where needed; [foundry.utils API](https://foundryvtt.com/api/v14/modules/foundry.utils.html).
- `game.settings.register`, `game.settings.get`, and `game.settings.set` persist the per-user and per-world release state; [Game Settings API](https://foundryvtt.com/api/v14/classes/foundry.GameSettings.html).

The exact `ready` callback and `ChatMessage.create` data shape must be verified against the Foundry v14 API before implementation. Community patterns for enriched chat content should be checked at the [Foundry community API wiki](https://foundryvtt.wiki/en/development/api).

## Risks / Trade-offs

- [Malformed historical Markdown] → Validate only the current release block and add a migration/documentation note; do not rewrite historical entries automatically.
- [A GM leaves before the setting write completes] → Set `lastAnnouncedMajorRelease` only after `ChatMessage.create` resolves; a later GM may retry safely.
- [Multiple GMs start simultaneously] → Re-read the setting immediately before creation and tolerate duplicate prevention through a guarded helper; add a unit test for the race-safe decision path.
- [Tutorial URLs become stale] → Reuse the existing tutorial-link source and verify its targets during each major-release checklist.
- [Generated templates are omitted from a package] → Keep generation in the existing build workflow and add an artifact-existence assertion.

## Migration Plan

1. Add the new setting with an empty default so existing worlds announce the next applicable major release once.
2. Normalize the current v14 changelog entry to the required marker and existing-tutorial reference format, then generate the packaged template.
3. Deploy runtime code; existing `lastSeenBreakingChangesVersion` values remain valid.
4. Roll back by disabling the chat-announcement hook and leaving the additive setting unused; no world document migration is required.

## Testing Strategy

- Pure parser/generator tests use the existing Jest style for utility modules: valid headings, missing headings, marker normalization, existing-tutorial reference validation, and generated HTML.
- Changelog startup tests use dynamic import with mocked `Hooks`, `game.settings`, `ChatMessage`, `DialogV2`, and `TextEditor`, following existing release/combat mock patterns.
- E2E verifies a GM startup in a fresh world, visible chat card/tutorial links, no duplicate on reload, and the import-required warning path. Existing settings and startup fixtures should be regression-checked.

## Open Questions

- Confirm the existing tutorial-link source to reuse during implementation.
- Should the major-release card be visible to all players by default, or be whispered to GMs with an optional player-facing post?
