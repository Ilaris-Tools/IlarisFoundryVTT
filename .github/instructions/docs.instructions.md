---
applyTo: 'docs/**/*.md'
---

# Documentation Conventions — Ilaris

## Language

- User-facing documentation is written in **German**.
- Technical developer documentation may use English for code references but German for explanations.

## Documentation Framework

- Built with **MkDocs** (config in `mkdocs.yml`).
- Source files live in `docs/`.

## Structure

| File/Directory            | Purpose                             |
| ------------------------- | ----------------------------------- |
| `docs/index.md`           | Landing page                        |
| `docs/foundry-basics.md`  | FoundryVTT concepts for new users   |
| `docs/einstellungen.md`   | System settings documentation       |
| `docs/hausregeln.md`      | House rules documentation           |
| `docs/faq.md`             | Frequently asked questions          |
| `docs/develop/`           | Developer documentation             |
| `docs/develop/tools.md`   | VS Code setup, build tools, linting |
| `docs/develop/bug-fix.md` | Bug fix workflow                    |
| `docs/develop/release.md` | Release process                     |
| `docs/img/`               | Documentation images                |

## Writing Style

- Use clear, concise German.
- Use FoundryVTT terminology consistently (see `.agents/GLOSSARY.md`).
- Link to related documentation using relative paths.
- Use Markdown formatting: headers, lists, code blocks, tables.
- Wrap inline code references in backticks.

## For AI Agents

When editing documentation:

- Preserve the existing German language style.
- Cross-reference with `docs/foundry-basics.md` for consistent terminology.
- When adding new pages, update `mkdocs.yml` navigation.
- Use relative links between docs.
