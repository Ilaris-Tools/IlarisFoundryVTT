## 1. Update E2E Spec Generator Agent Definition

- [x] 1.1 Read existing `.github/agents/e2e-spec-generator.md` for current structure
- [x] 1.2 Add "Mandatory Quality Rules" section with 6 rules: (1) Playwright fixture isolation — use `test('name', async ({ page }) => {...})`, never shared mutable state or `browser.newPage()`; (2) Predicate-based waits — `waitForFunction`/`expect().toBeVisible()`, never `waitForTimeout`; (3) AppV2 click fallback — always include `dispatchEvent(new MouseEvent(...))` after primary click; (4) Exact message count assertions — `=== baseline + N`, not `> beforeCount`; (5) Research phase — find 2+ existing tests in the same feature area and extract their wait/click/assertion patterns verbatim; (6) Post-generation checklist — verify no anti-patterns before presenting output
- [x] 1.3 Add concrete code examples for each rule showing the correct pattern (sourced from existing tests e2e-001, e2e-010)
- [x] 1.4 Update the "Output" section to include the post-generation verification checklist as part of the agent's workflow

## 2. Sync E2E Testing Spec

- [x] 2.1 Sync delta spec to `openspec/specs/e2e-testing/spec.md`: apply MODIFIED "E2E Spec Generator agent" requirement with 6 new quality rule scenarios

## 3. Validation

- [x] 3.1 Run `npm run lint` to ensure no style violations in modified files
- [x] 3.2 Verify the agent definition follows the same YAML frontmatter format as other `.github/agents/` files
- [x] 3.3 Verify each quality rule in the agent maps to a scenario in the spec
