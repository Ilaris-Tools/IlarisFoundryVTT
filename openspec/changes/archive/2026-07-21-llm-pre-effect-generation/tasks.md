## 1. Register client-scoped LLM settings

- [x] 1.1 Add `llmApiUrl`, `llmApiKey`, `llmModel` to `IlarisGameSettingNames`
- [x] 1.2 Register 3 settings in `configure-game-settings.js` with `scope: "client"`, `type: String`, `default: ""`
- [x] 1.3 Verify against Foundry API docs (v14) — client scope stores in localStorage, never synced

## 2. Add LLM settings UI to IlarisSettingsDialog

- [x] 2.1 In `_prepareContext()`, read LLM settings and pass to context
- [x] 2.2 Add LLM settings section to `ilaris-settings_general.hbs` — `type="password"` for API key, `{{#if isGM}}`
- [x] 2.3 In `#onSaveSettings`, save LLM field values via generalDefs array
- [x] 2.4 In `#onResetSettings`, reset LLM settings to empty strings

## 3. Create LLM prompt builder utility

- [x] 3.1 Create `scripts/effects/utils/llm-prompt-builder.js`
- [x] 3.2 System message: role, JSON schema, available keys, damage types, response format
- [x] 3.3 User message: spell name, text, maechtig, wirkungsdauer, ziel, reichweite, fertigkeiten
- [x] 3.4 Return `{model, messages}`

## 4. Add generate button to übernatürlich item sheet

- [x] 4.1 `_prepareContext()` passes `isGM` and `hasLLMConfig`
- [x] 4.2 "🤖 Generieren" button in `pre-effects.hbs` wrapped in `{{#if @root.hasLLMConfig}}`
- [x] 4.3 Click handler: validate config, build prompt, call API, parse response, update document
- [x] 4.4 Error cases: network error → notify, invalid JSON → notify with excerpt
- [x] 4.5 Loading state ("⏳ Wird generiert...") during request, restore on success/error

## 5. Unit Tests

- [x] 5.1 Create `scripts/effects/utils/_spec/llm-prompt-builder.spec.js`
- [x] 5.2 Test: `buildPreEffectPrompt()` returns correct structure
- [x] 5.3 Test: system message contains JSON schema
- [x] 5.4 Test: system message lists damage types
- [x] 5.5 Test: system message lists system keys
- [x] 5.6 Test: user message contains spell metadata

## 6. Documentation

- [x] 6.0 Add LLM settings to `docs/einstellungen.md`
- [x] 6.1 Add LLM settings to `Welteinstellungen_Quick_Reference` compendium
- [x] 6.2 Run `npm run pack-all` after compendium edit

## 7. Validation

- [x] 7.1 Run `npm run lint` ✅
- [x] 7.2 Run `npm test` (472/472) ✅
- [ ] 7.3 Manual: LLM fields appear (GM) / hidden (non-GM)
- [ ] 7.4 Manual: generate preEffects from API
- [ ] 7.5 Manual: error cases
