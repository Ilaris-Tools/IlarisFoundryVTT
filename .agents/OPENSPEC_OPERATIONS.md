# Canonical OpenSpec Operation Instructions

This file is the authoritative operation body for the repository's OpenSpec workflows. It preserves the refined Codex wording verbatim; where earlier provider copies differed, this wording wins.

Read [AGENTS.md](../AGENTS.md) first. It defines repository-wide policy, including the required `## Proposal Self-Review` gate. Provider adapters in `.claude/commands/`, `.codex/skills/`, `.github/prompts/`, and `.github/skills/` MUST contain only provider metadata plus a link to their matching section below.

## Explore (`openspec-explore`)

Enter explore mode. Think deeply. Visualize freely. Follow the conversation wherever it goes.

**IMPORTANT: Explore mode is for thinking, not implementing.** You may read files, search code, and investigate the codebase, but you must NEVER write code or implement features. If the user asks you to implement something, remind them to exit explore mode first and create a change proposal. You MAY create OpenSpec artifacts (proposals, designs, specs) if the user asks—that's capturing thinking, not implementing.

**This is a stance, not a workflow.** There are no fixed steps, no required sequence, no mandatory outputs. You're a thinking partner helping the user explore.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

---

## The Stance

- **Curious, not prescriptive** - Ask questions that emerge naturally, don't follow a script
- **Open threads, not interrogations** - Surface multiple interesting directions and let the user follow what resonates. Don't funnel them through a single path of questions.
- **Visual** - Use ASCII diagrams liberally when they'd help clarify thinking
- **Adaptive** - Follow interesting threads, pivot when new information emerges
- **Patient** - Don't rush to conclusions, let the shape of the problem emerge
- **Grounded** - Explore the actual codebase when relevant, don't just theorize

---

## What You Might Do

Depending on what the user brings, you might:

**Explore the problem space**

- Ask clarifying questions that emerge from what they said
- Challenge assumptions
- Reframe the problem
- Find analogies

**Investigate the codebase**

- Map existing architecture relevant to the discussion
- Find integration points
- Identify patterns already in use
- Surface hidden complexity

**Surface testing impact (where applicable)**

- When a change touches UI/dialogs, note which existing E2E test cases exercise that area and ask whether they should be regression-verified
- When a change introduces new pure functions or helpers, note that they are unit-testable and ask whether test tasks should be created
- When a change is a pure internal refactor with no UI or API surface change, focus on unit test coverage and skip E2E questions
- Identify which `_spec_/` directories already exist for the affected modules and which test patterns (pure function, dynamic import, jest.mock, Object.create) are used there
- This is a lens, not a checklist — testing questions are surfaced naturally where applicable, not forced for every change

**Compare options**

- Brainstorm multiple approaches
- Build comparison tables
- Sketch tradeoffs
- Recommend a path (if asked)

**Visualize**

```
┌─────────────────────────────────────────┐
│     Use ASCII diagrams liberally        │
├─────────────────────────────────────────┤
│                                         │
│      ┌────────┐         ┌────────┐      │
│      │ State  │────────▶│ State  │      │
│      │   A    │         │   B    │      │
│      └────────┘         └────────┘      │
│                                         │
│   System diagrams, state machines,      │
│   data flows, architecture sketches,    │
│   dependency graphs, comparison tables  │
│                                         │
└─────────────────────────────────────────┘
```

**Surface risks and unknowns**

- Identify what could go wrong
- Find gaps in understanding
- Suggest spikes or investigations

---

## OpenSpec Awareness

You have full context of the OpenSpec system. Use it naturally, don't force it.

### Check for context

At the start, quickly check what exists:

```bash
openspec list --json
```

This tells you:

- If there are active changes
- Their names, schemas, and status
- What the user might be working on

### When no change exists

Think freely. When insights crystallize, you might offer:

- "This feels solid enough to start a change. Want me to create a proposal?"
- Or keep exploring - no pressure to formalize

### When a change exists

If the user mentions a change or you detect one is relevant:

1. **Resolve and read existing artifacts for context**
    - Run `openspec status --change "<name>" --json`.
    - Use `changeRoot`, `artifactPaths`, and `actionContext` from the status JSON.
    - Read existing files from `artifactPaths.<artifact>.existingOutputPaths`.

2. **Reference them naturally in conversation**
    - "Your design mentions using Redis, but we just realized SQLite fits better..."
    - "The proposal scopes this to premium users, but we're now thinking everyone..."

3. **Offer to capture when decisions are made**

    | Insight Type               | Where to Capture             |
    | -------------------------- | ---------------------------- |
    | New requirement discovered | `specs/<capability>/spec.md` |
    | Requirement changed        | `specs/<capability>/spec.md` |
    | Design decision made       | `design.md`                  |
    | Scope changed              | `proposal.md`                |
    | New work identified        | `tasks.md`                   |
    | Assumption invalidated     | Relevant artifact            |

    Example offers:
    - "That's a design decision. Capture it in design.md?"
    - "This is a new requirement. Add it to specs?"
    - "This changes scope. Update the proposal?"

4. **The user decides** - Offer and move on. Don't pressure. Don't auto-capture.

---

## What You Don't Have To Do

- Follow a script
- Ask the same questions every time
- Produce a specific artifact
- Reach a conclusion
- Stay on topic if a tangent is valuable
- Be brief (this is thinking time)

---

## Handling Different Entry Points

**User brings a vague idea:**

```
User: I'm thinking about adding real-time collaboration

You: Real-time collab is a big space. Let me think about this...

      COLLABORATION SPECTRUM
      ════════════════════════════════════════════

      Awareness          Coordination         Sync
          │                   │                 │
          ▼                   ▼                 ▼
      ┌────────┐         ┌────────┐        ┌────────┐
      │Presence│         │Cursors │        │  CRDT  │
      │  "3    │         │ Multi  │        │Conflict│
      │online" │         │ select │        │  free  │
      └────────┘         └────────┘        └────────┘
          │                   │                 │
       trivial            moderate           complex

      Where's your head at?
```

**User brings a specific problem:**

```
User: The auth system is a mess

You: [reads codebase]

     ┌─────────────────────────────────────────────┐
     │              CURRENT AUTH FLOW              │
     └─────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     ┌─────────┐  ┌─────────┐  ┌─────────┐
     │ Google  │  │  GitHub │  │  Email  │
     │  OAuth  │  │  OAuth  │  │  Magic  │
     └────┬────┘  └────┬────┘  └────┬────┘
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                  ┌───────────┐
                  │  Session  │
                  └─────┬─────┘
                        │
                        ▼
                  ┌───────────┐
                  │   Perms   │
                  └───────────┘

     I see three tangles. Which one's burning?
```

**User is stuck mid-implementation:**

```
User: /opsx:explore add-auth-system
      The OAuth integration is more complex than expected

You: [reads change artifacts]

     You're on task 4: "Implement OAuth flow"

     Let me trace what's involved...

     [draws diagram, explores options, suggests paths]

     Want to update the design to reflect this?
     Or add a spike task to investigate?
```

**User wants to compare options:**

```
User: Should we use Postgres or SQLite?

You: Generic answer is boring. What's the context?

User: A CLI tool that tracks local dev environments

You: That changes everything.

     ┌─────────────────────────────────────────────────┐
     │          CLI TOOL DATA STORAGE                  │
     └─────────────────────────────────────────────────┘

     Key constraints:
     • No daemon running
     • Must work offline
     • Single user

                  SQLite          Postgres
     Deployment   embedded ✓      needs server ✗
     Offline      yes ✓           no ✗
     Single file  yes ✓           no ✗

     SQLite. Not even close.

     Unless... is there a sync component?
```

---

## Ending Discovery

There's no required ending. Discovery might:

- **Flow into a proposal**: "Ready to start? I can create a change proposal."
- **Result in artifact updates**: "Updated design.md with these decisions"
- **Just provide clarity**: User has what they need, moves on
- **Continue later**: "We can pick this up anytime"

When it feels like things are crystallizing, you might summarize:

```
## What We Figured Out

**The problem**: [crystallized understanding]

**The approach**: [if one emerged]

**Open questions**: [if any remain]

**Next steps** (if ready):
- Create a change proposal
- Keep exploring: just keep talking
```

But this summary is optional. Sometimes the thinking IS the value.

---

## Guardrails

- **Don't implement** - Never write code or implement features. Creating OpenSpec artifacts is fine, writing application code is not.
- **Don't fake understanding** - If something is unclear, dig deeper
- **Don't rush** - Discovery is thinking time, not task time
- **Don't force structure** - Let patterns emerge naturally
- **Don't auto-capture** - Offer to save insights, don't just do it
- **Do visualize** - A good diagram is worth many paragraphs
- **Do explore the codebase** - Ground discussions in reality
- **Do question assumptions** - Including the user's and your own

---

## Propose (`openspec-propose`)

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

**Guardrails**

- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next

---

## Apply (`openspec-apply-change`)

Implement tasks from an OpenSpec change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

    If a name is provided, use it. Otherwise:
    - Infer from conversation context if the user mentioned a change
    - Auto-select if only one active change exists
    - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

    Always announce: "Using change: <name>" and how to override (e.g., `/opsx:apply <other>`).

2. **Check status to understand the schema**

    ```bash
    openspec status --change "<name>" --json
    ```

    Parse the JSON to understand:
    - `schemaName`: The workflow being used (e.g., "spec-driven")
    - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
    - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

    ```bash
    openspec instructions apply --change "<name>" --json
    ```

    This returns:
    - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
    - Progress (total, complete, remaining)
    - Task list with status
    - Dynamic instruction based on current state

    **Handle states:**
    - If `state: "blocked"` (missing artifacts): show message, suggest using openspec-continue-change
    - If `state: "all_done"`: congratulate, suggest archive
    - Otherwise: proceed to implementation

4. **Read context files**

    Read every file path listed under `contextFiles` from the apply instructions output.
    The files depend on the schema being used:
    - **spec-driven**: proposal, specs, design, tasks
    - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

    Display:
    - Schema being used
    - Progress: "N/M tasks complete"
    - Remaining tasks overview
    - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

    For each pending task:
    - Show which task is being worked on
    - Make the code changes required
    - Keep changes minimal and focused
    - Mark task complete in the tasks file: `- [ ]` → `- [x]`
    - Continue to next task

    **Test-first ordering**: When a code implementation task has a corresponding unit test task in the task list, execute the test task before the code task. Write the test, verify it fails, implement the code, then verify the test passes. For E2E test tasks, generate a `.spec.ts` file from the referenced spec scenario using existing shared fixtures as patterns, or delegate to the E2E Spec Generator agent if more complex setup is needed.

    **Pause if:**
    - Task is unclear → ask for clarification
    - Implementation reveals a design issue → suggest updating artifacts
    - Error or blocker encountered → report and wait for guidance
    - User interrupts

7. **On completion or pause, show status**

    Display:
    - Tasks completed this session
    - Overall progress: "N/M tasks complete"
    - If all done: suggest archive
    - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! Ready to archive this change.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**

- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly

---

## Sync (`openspec-sync-specs`)

Sync delta specs from a change to main specs.

This is an **agent-driven** operation - you will read delta specs and directly edit main specs to apply the changes. This allows intelligent merging (e.g., adding a scenario without copying the entire requirement).

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

    Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

    Show changes that have delta specs (under `specs/` directory).

    **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Resolve change context**

    Run:

    ```bash
    openspec status --change "<name>" --json
    ```

3. **Find delta specs**

    Use `artifactPaths.specs.existingOutputPaths` from the status JSON as the list of delta spec files.

    Each delta spec file contains sections like:
    - `## ADDED Requirements` - New requirements to add
    - `## MODIFIED Requirements` - Changes to existing requirements
    - `## REMOVED Requirements` - Requirements to remove
    - `## RENAMED Requirements` - Requirements to rename (FROM:/TO: format)

    If no delta specs found, inform user and stop.

4. **For each delta spec, apply changes to main specs**

    For each repo-local capability delta spec path returned by the CLI:

    a. **Read the delta spec** to understand the intended changes

    b. **Read the main spec** at `openspec/specs/<capability>/spec.md` (may not exist yet)

    c. **Apply changes intelligently**:

    **ADDED Requirements:**
    - If requirement doesn't exist in main spec → add it
    - If requirement already exists → update it to match (treat as implicit MODIFIED)

    **MODIFIED Requirements:**
    - Find the requirement in main spec
    - Apply the changes - this can be:
        - Adding new scenarios (don't need to copy existing ones)
        - Modifying existing scenarios
        - Changing the requirement description
    - Preserve scenarios/content not mentioned in the delta

    **REMOVED Requirements:**
    - Remove the entire requirement block from main spec

    **RENAMED Requirements:**
    - Find the FROM requirement, rename to TO

    d. **Create new main spec** if capability doesn't exist yet:
    - Create `openspec/specs/<capability>/spec.md`
    - Add Purpose section (can be brief, mark as TBD)
    - Add Requirements section with the ADDED requirements

5. **Show summary**

    After applying all changes, summarize:
    - Which capabilities were updated
    - What changes were made (requirements added/modified/removed/renamed)

**Delta Spec Format Reference**

```markdown
## ADDED Requirements

### Requirement: New Feature

The system SHALL do something new.

#### Scenario: Basic case

- **WHEN** user does X
- **THEN** system does Y

## MODIFIED Requirements

### Requirement: Existing Feature

#### Scenario: New scenario to add

- **WHEN** user does A
- **THEN** system does B

## REMOVED Requirements

### Requirement: Deprecated Feature

## RENAMED Requirements

- FROM: `### Requirement: Old Name`
- TO: `### Requirement: New Name`
```

**Key Principle: Intelligent Merging**

Unlike programmatic merging, you can apply **partial updates**:

- To add a scenario, just include that scenario under MODIFIED - don't copy existing scenarios
- The delta represents _intent_, not a wholesale replacement
- Use your judgment to merge changes sensibly

**Output On Success**

```
## Specs Synced: <change-name>

Updated main specs:

**<capability-1>**:
- Added requirement: "New Feature"
- Modified requirement: "Existing Feature" (added 1 scenario)

**<capability-2>**:
- Created new spec file
- Added requirement: "Another Feature"

Main specs are now updated. The change remains active - archive when implementation is complete.
```

**Guardrails**

- Read both delta and main specs before making changes
- Preserve existing content not mentioned in delta
- If something is unclear, ask for clarification
- Show what you're changing as you go
- The operation should be idempotent - running twice should give same result

---

## Archive (`openspec-archive-change`)

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

    Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

    Show only active changes (not already archived).
    Include the schema used for each change if available.

    **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

    Run `openspec status --change "<name>" --json` to check artifact completion.

    Parse the JSON to understand:
    - `schemaName`: The workflow being used
    - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
    - `artifacts`: List of artifacts with their status (`done` or other)

    **If any artifacts are not `done`:**
    - Display warning listing incomplete artifacts
    - Use **AskUserQuestion tool** to confirm user wants to proceed
    - Proceed if user confirms

3. **Check task completion status**

    Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

    Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

    **If incomplete tasks found:**
    - Display warning showing count of incomplete tasks
    - Use **AskUserQuestion tool** to confirm user wants to proceed
    - Proceed if user confirms

    **If no tasks file exists:** Proceed without task-related warning.

4. **Check test coverage (where applicable)**

    If the change's proposal or design listed testing impact, verify that corresponding test files exist:
    - For unit tests: check that `_spec_/` directories contain test files for the modified modules
    - For E2E tests: check that `.spec.ts` files exist for new E2E cases listed in the Testing Impact section

    **If test files are missing:**
    - Note the gap but do NOT block archival — the "where applicable" principle applies
    - Include the gap in the archive summary under warnings

    **If no testing impact was declared:** Skip this check.

5. **Assess delta spec sync state**

    Use `artifactPaths.specs.existingOutputPaths` from status JSON to check for delta specs. If none exist, proceed without sync prompt.

    **If delta specs exist:**
    - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
    - Determine what changes would be applied (adds, modifications, removals, renames)
    - Show a combined summary before prompting

    **Prompt options:**
    - If changes needed: "Sync now (recommended)", "Archive without syncing"
    - If already synced: "Archive now", "Sync anyway", "Cancel"

    If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

6. **Perform the archive**

    Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:

    ```bash
    mkdir -p "<planningHome.changesDir>/archive"
    ```

    Generate target name using current date: `YYYY-MM-DD-<change-name>`

    **Check if target already exists:**
    - If yes: Fail with error, suggest renaming existing archive or using different date
    - If no: Move `changeRoot` to the archive directory

    ```bash
    mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
    ```

7. **Display summary**

    Show archive completion summary including:
    - Change name
    - Schema that was used
    - Archive location
    - Whether specs were synced (if applicable)
    - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")

All artifacts complete. All tasks complete.
```

**Guardrails**

- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use openspec-sync-specs approach (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
