# Utils scripts

Utility scripts that help to build the database of the Ilaris system for Foundry VTT.

Whenever there are changes in the `packs/*/_source` directories, the `pack-all.js` script should be
executed from the root level:

```bash
# Make sure to be at the root level of this repo
node utils/pack-all.js
```

## generate-breaking-changes.js

Generates a Handlebars template file with breaking changes extracted from `CHANGELOG.md`.

### What it does

1. Reads the current version from `system.json`
2. Parses `CHANGELOG.md` to find the "Breaking Change" section for that version
3. Converts the markdown to HTML
4. Generates a `.hbs` template file in `templates/changes/`
5. If no breaking changes are found, it cleans up any existing template for that version

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
templates/changes/breaking-changes-12.2.hbs
```

This template is then automatically loaded by the changelog notification system in FoundryVTT.

### CHANGELOG.md Format

The script expects this format in your CHANGELOG.md:

```markdown
### v12.2

#### Breaking Change

-   Your breaking change item 1
-   Your breaking change item 2

#### Features

-   Other changes...
```

### When to run

You should run this script:

-   ✅ Before creating a new release
-   ✅ After updating the CHANGELOG.md with breaking changes
-   ✅ As part of your automated deployment process
-   ✅ Before testing the breaking changes dialog locally

### Integration with FoundryVTT

The generated `.hbs` files are served as static files by FoundryVTT. The changelog notification hook (`scripts/hooks/changelog-notification.js`) automatically fetches and displays the appropriate template based on the current system version.

This approach ensures that:

-   ✅ No client-side parsing of CHANGELOG.md needed
-   ✅ Breaking changes are always available, even in deployed environments
-   ✅ Templates are version-specific and can be cached
-   ✅ No network requests to external URLs needed
