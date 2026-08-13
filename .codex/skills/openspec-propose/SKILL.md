---
name: openspec-propose
description: Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.
license: MIT
compatibility: Requires openspec CLI.
metadata:
    author: openspec
    version: '1.0'
    generatedBy: '1.5.0'
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:

- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)

When ready to implement, run /opsx:apply

---

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

    Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:

    > "What change do you want to work on? Describe what you want to build or fix."

    From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

    **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**

    ```bash
    openspec new change "<name>"
    ```

    This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

3. **Get the artifact build order**

    ```bash
    openspec status --change "<name>" --json
    ```

    Parse the JSON to get:
    - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
    - `artifacts`: list of all artifacts with their status and dependencies
    - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

4. **Create artifacts in sequence until apply-ready**

    Use the **TodoWrite tool** to track progress through the artifacts.

    Loop through artifacts in dependency order (artifacts with no pending dependencies first):

    a. **For each artifact that is `ready` (dependencies satisfied)**:
    - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
    - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
    - Read any completed dependency files for context
    - Create the artifact file using `template` as the structure and write it to `resolvedOutputPath`
    - Apply `context` and `rules` as constraints - but do NOT copy them into the file
    - Show brief progress: "Created <artifact-id>"

    b. **Continue until all `applyRequires` artifacts are complete**
    - After creating each artifact, re-run `openspec status --change "<name>" --json`
    - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
    - Stop when all `applyRequires` artifacts are done

    c. **If an artifact requires user input** (unclear context):
    - Use **AskUserQuestion tool** to clarify
    - Then continue with creation

5. **Show final status**
    ```bash
    openspec status --change "<name>"
    ```

**Output**

After completing all artifacts, summarize:

- Change name and location
- List of artifacts created with brief descriptions
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/opsx:apply` or ask me to implement to start working on the tasks."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
    - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
    - These guide what you write, but should never appear in the output
- **Testing-aware artifacts**:
    - **proposal.md**: Include a "Testing Impact" section when the change affects user-facing behavior or introduces new logic. List new unit test scenarios, existing unit tests to update, new E2E cases needed, existing E2E cases affected. For E2E cases, capture environment context: players needed, world state, and shared code candidates to promote to `e2e/shared/`.
    - **design.md**: Include a "Testing Strategy" section when applicable. Identify testable units and which existing test patterns (pure function, dynamic import, jest.mock, Object.create) apply. List E2E coverage for new or modified user flows.
    - **tasks.md**: Include dedicated "Unit Tests" and "E2E Tests" task groups (as numbered `## N.` sections) when the change requires testing. Unit test tasks should reference the `_spec_/` file to create or update. E2E test tasks should reference the spec scenario(s) they implement and note whether existing cases need regression verification.
- **UI-aware artifacts**: When a change affects a rendered Foundry sheet, dialog, sidebar, chat card, setting, map control, or CSS, capture a **UI acceptance contract** in `design.md`. State the affected surface, top-to-bottom section order or tab/part placement, headings and controls that remain visible, and light/dark-theme scope. Separate reusable behavior from concrete layout ownership: a shared base or mixin may provide context and listeners, but each sheet decides where its section renders. Include the required visible runtime path and screenshot evidence in the testing strategy, and add an explicit visual E2E/runtime task. If the intended order is not known, stop and ask rather than silently choosing an insertion point.

**Guardrails**

- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
