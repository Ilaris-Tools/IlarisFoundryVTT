## Why

Configuring pre-effects manually requires understanding the Actor data model, damage types, formula syntax, and Mächtige Magie amplification rules. LLMs already understand JSON schemas and game rules — sending the spell's text and metadata to an LLM can generate a valid pre-effect configuration automatically. This speeds up the most time-consuming part of spell setup.

## What Changes

- **3 client-scoped settings** (`llmApiUrl`, `llmApiKey`, `llmModel`): Stored in the GM's browser `localStorage` only — never synced to the world database. The API key uses `<input type="password">` in the settings UI. Defaults are empty (user must configure).
- **"🤖 Generieren" button** in the pre-effects section: Visible only to GMs (`game.user.isGM`) AND only when API URL and key are configured (`hasLLMConfig`). Hidden otherwise — no misleading clickable button that fails.
- **`llm-prompt-builder.js` utility**: Constructs the system prompt with damage types (`damageTypes` setting), available Actor keys (`collectActorSystemPaths()`), the pre-effect JSON schema, and the spell data. Returns `{model, messages}` for the API call.
- **OpenAI-compatible chat completions API**: Works with OpenAI, Anthropic (via proxy), Ollama, LM Studio, and any OpenAI-compatible endpoint.
- **One request per click**: Button disables during request, re-enables after response. Response is parsed as JSON and applied directly to `preEffects`.

## Capabilities

### New Capabilities

- `llm-pre-effect-generation`: LLM-assisted pre-effect creation via OpenAI-compatible chat completions API

### Modified Capabilities

- `settings`: Settings dialog gains client-scoped LLM configuration fields (GM only)

## Impact

- **NEW**: `scripts/effects/utils/llm-prompt-builder.js` — `buildPreEffectPrompt(spellData, damageTypes, systemKeys)`
- **MODIFIED**: `scripts/settings/configure-game-settings.model.js` — add `llmApiUrl`, `llmApiKey`, `llmModel`
- **MODIFIED**: `scripts/settings/configure-game-settings.js` — register 3 client-scoped settings
- **MODIFIED**: `scripts/settings/ilaris-settings.dialog.js` — `_prepareContext()`, `_onRender()`, `#onSaveSettings()`
- **MODIFIED**: `scripts/settings/templates/ilaris-settings_general.hbs` — LLM settings section (GM only)
- **MODIFIED**: `scripts/items/sheets/uebernatuerlich-talent.js` — "🤖 Generieren" button + handler
- **MODIFIED**: `docs/einstellungen.md` — document LLM settings in the settings reference
- **MODIFIED**: `comp_packs/kurzuebersichten/_source/Welteinstellungen_Quick_Reference_welt001abc.json` — add LLM settings section to in-game quick reference journal
- **API**: `fetch()` to configured URL, JSON request/response

## Testing Impact

- **Unit tests**: `llm-prompt-builder.js` is a pure function — fully testable with `_spec_/` tests for prompt structure, context inclusion, and JSON schema in the system message
- **Manual tests**: Configure API settings, click generate on a spell, verify response populates preEffects. Test error cases: invalid URL, invalid API key, invalid JSON response, network timeout
- **No E2E tests** needed — this is a GM-only UI enhancement with no multiplayer interaction
