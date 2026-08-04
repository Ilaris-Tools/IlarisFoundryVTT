# Utils scripts

Utility scripts that help to build the database of the Ilaris system for Foundry VTT.

Whenever there are changes in the `packs/*/_source` directories, the `pack-all.js` script should be
executed from the root level:

```bash
# Make sure to be at the root level of this repo
node utils/pack-all.js
```

## generate-breaking-changes.js

Generates a Handlebars (`.hbs`) template file with breaking changes extracted from `CHANGELOG.md`. The Markdown content is converted to HTML during the build process using the `marked` library.

### What it does

1. Reads the current version from `system.json`
2. Validates the current `## v<major>` and `### v<major>.<minor>` headings and parses the "Breaking Changes" section (supports flexible heading variants)
3. Converts the Markdown content to HTML using the `marked` library
4. Generates a `.hbs` file in `scripts/changelog/templates/` with the HTML content
5. Generates versioned JSON metadata used by the major-release chat announcement
6. If no breaking changes are found, it cleans up any existing template for that version
7. Removes old generated files while retaining the current major-release metadata

### Markdown-to-HTML Conversion

The script uses the `marked` library for reliable Markdown-to-HTML conversion:

- Supports lists, bold text, links, code blocks, and other Markdown features
- Option `headerIds: false` prevents automatic ID generation for headings
- More robust than manual string manipulation
- Handles nested lists and complex formatting correctly

### Usage

**Manual run:**

```bash
npm run generate-breaking-changes
```

**As part of your build/deployment:**
Add it to your GitHub Actions workflow or other CI/CD pipeline:

```yaml
- name: Generate breaking changes template
  run: npm run generate-breaking-changes
```

### Output

The script generates a file like:

```
scripts/changelog/templates/breaking-changes-12.3.hbs
```

This `.hbs` file contains HTML content converted from Markdown and is automatically loaded by the changelog notification system in FoundryVTT.

### CHANGELOG.md Format

The script expects this format in your CHANGELOG.md:

```markdown
## v14

### v14.0

#### Breaking Change

Import erforderlich: Ja
Tutorials: @UUID[Compendium.Ilaris.kurzuebersichten.JournalEntry.kurzimport001]{Charakter-Import}

Bitte wie immer die Charaktere neu importieren...

##### Sub-section

- Your breaking change item 1
- Your breaking change item 2

---

#### Features

- Other changes...
```

**Important:** A breaking-change section must explicitly declare `Import erforderlich: Ja` or `Import erforderlich: Nein`. Major releases must reference at least one existing tutorial with a `Tutorials:` line. Tutorial prose belongs in the maintained tutorial/quick-reference content, not in the changelog.

**Flexible heading support:**
The script recognizes various heading formats (case-insensitive):

- `#### Breaking Change` (singular)
- `#### Breaking Changes` (plural)
- `#### ⚠️ Breaking Changes` (with emoji)
- `#### BREAKING CHANGE:` (uppercase with/without colon)
- Any combination of the above

### When to run

You should run this script:

- ✅ Before creating a new release
- ✅ After updating the CHANGELOG.md with breaking changes
- ✅ As part of your automated deployment process
- ✅ Before testing the breaking changes dialog locally

### Integration with FoundryVTT

The generated `.hbs` files are served as static files by FoundryVTT. The changelog notification hook (`scripts/changelog/changelog-notification.js`) automatically fetches and displays the appropriate template based on the current system version:

1. Loads the `.hbs` file as HTML
2. Applies Foundry's `TextEditor.enrichHTML()` for @UUID links and other enrichment
3. Displays the result in a read-only dialog

This approach ensures that:

- ✅ HTML is generated at build time using the reliable `marked` library
- ✅ No client-side Markdown parsing needed
- ✅ Breaking changes are always available, even in deployed environments
- ✅ Templates are version-specific and can be cached
- ✅ No network requests to external URLs needed
- ✅ Supports complex Markdown features (nested lists, links, bold text, etc.)
- ✅ Markdown content is rendered with full Foundry VTT formatting support
