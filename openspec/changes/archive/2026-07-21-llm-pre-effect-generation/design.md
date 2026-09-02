## Context

The pre-effects system requires manual configuration of JSON fields: damage formulas, `system.*` key paths, duration values, Mächtige Magie bonuses, and damage types. LLMs can generate this structured data from natural language descriptions. The feature sends the spell's metadata to an OpenAI-compatible chat completions API and parses the response into a `preEffects[]` array.

Security: API key is stored client-scoped in `localStorage` — never leaves the GM's browser. The "Generieren" button is hidden from non-GMs.

## Goals / Non-Goals

**Goals:**

- 3 client-scoped settings: API URL, API key (password-masked), model name
- GM-only "🤖 Generieren" button in the pre-effects section — hidden when API URL or key is empty
- Build a structured prompt with spell data, damage types, system keys, and JSON schema
- Send one request per click via `fetch()`, parse the JSON response, apply to `preEffects`
- Handle errors gracefully (network, invalid JSON, API errors)

**Non-Goals:**

- Multi-spell batch generation
- Streaming responses
- Conversation/multi-turn refinement
- Caching or rate limiting
- Supporting non-OpenAI-compatible APIs

## Decisions

### Decision 1: Client-scoped settings for API credentials

**Chosen**: All 3 LLM settings (`llmApiUrl`, `llmApiKey`, `llmModel`) use `scope: "client"`.

**Rationale**: Client settings are stored in `localStorage` — never synced to the world database, never exported, never visible to other users. The API key input uses `<input type="password">` for masking. Non-GMs never see these fields (`{{#if isGM}}` guard in template).

### Decision 2: OpenAI-compatible chat completions API

**Chosen**: POST to `{llmApiUrl}` with `{model, messages: [{role, content}]}`. Parse `response.choices[0].message.content` as JSON.

**Rationale**: This is the de facto standard. OpenAI, Anthropic (via OpenRouter), Ollama, LM Studio, DeepSeek, and most self-hosted LLMs support this format. No vendor lock-in. Example URLs:

| Provider       | URL                                             | Model example   |
| -------------- | ----------------------------------------------- | --------------- |
| OpenAI         | `https://api.openai.com/v1/chat/completions`    | `gpt-4o`        |
| OpenRouter     | `https://openrouter.ai/api/v1/chat/completions` | `openai/gpt-4o` |
| DeepSeek       | `https://api.deepseek.com/v1/chat/completions`  | `deepseek-chat` |
| Ollama (local) | `http://localhost:11434/v1/chat/completions`    | `llama3`        |

### Decision 3: Single request, direct apply

**Chosen**: One button click = one API call. Response is parsed and applied directly to `this.document.system.preEffects`. Button shows a spinner/loading state ("⏳ Wird generiert...") during the request, re-enables after.

**Rationale**: Simplicity. No preview/confirmation dialog needed — the user can edit the generated pre-effects immediately afterward via the existing UI.

### Decision 4: Prompt includes full system context

**Chosen**: The system message includes:

- Available damage types from the `damageTypes` world setting
- Available `system.*` key paths from `collectActorSystemPaths()`
- The exact pre-effect JSON schema (as a TypeScript interface)
- Instructions to return ONLY valid JSON, no markdown wrapping

**Rationale**: The LLM needs complete context to generate valid keys and damage types. Without the key list, it would hallucinate non-existent paths. Without the schema, it would return malformed JSON.

### Decision 5: Separate prompt builder utility

**Chosen**: `scripts/effects/utils/llm-prompt-builder.js` exports `buildPreEffectPrompt(spellData, damageTypes, systemKeys)`.

**Rationale**: Pure function — no DOM, no Foundry dependencies except config. Fully unit-testable. Separates prompt construction from API call logic.

## API Surface

### Foundry APIs

- `game.settings.get('Ilaris', 'llmApiUrl')` / `llmApiKey` / `llmModel` — read client settings
- `game.user.isGM` — gate the generate button
- `collectActorSystemPaths()` — get valid system keys for the prompt

### External API

- `fetch(llmApiUrl, {method: 'POST', headers: {Authorization, 'Content-Type'}, body: JSON})`
- Response: `{choices: [{message: {content: "..."}}]}` — standard chat completions format

## Risks / Trade-offs

- **[Risk] API key in localStorage** → Mitigation: `scope: "client"` + `<input type="password">` + `{{#if isGM}}` guard. Same security model as other browser-stored API keys.
- **[Risk] LLM returns invalid JSON** → Mitigation: `try/catch` around `JSON.parse()`, show `ui.notifications.error()` with the raw response excerpt
- **[Risk] LLM hallucinates wrong keys** → Mitigation: Include the full `system.*` key list in the prompt. The LLM chooses from the provided list.
- **[Risk] Large prompt exceeds token limits** → Mitigation: The system key list can be ~200 paths. Trim to top-level categories if needed. Model context windows are typically 8K+ tokens.
- **[Risk] Network errors** → Mitigation: Standard `fetch` error handling, timeout after 30s, re-enable button on failure

## Testing Strategy

- **`llm-prompt-builder.js`**: Pure function, fully unit-testable. Test with mock spell data to verify prompt structure, JSON schema inclusion, and key list formatting.
- **API call**: Manual testing only (requires configured API endpoint). Test success and error paths.
- **UI**: Manual testing — verify button visibility (GM vs non-GM), button disabled state during request, error notifications.
