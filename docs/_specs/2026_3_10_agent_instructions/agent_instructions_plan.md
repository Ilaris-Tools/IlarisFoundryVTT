# Plan: Agent Best Practices for Ilaris System

**TL;DR**: We're creating a comprehensive, English-language documentation system with separate folders for GitHub-specific instructions (.github/agents/) and general AI-tool guidance (.agents/). The setup follows Foundry VTT best practices (PF2e, D&D5e) and enables agents/subagents to work effectively on the system — with clear architecture, code conventions, API patterns, and contextual knowledge. Pure Markdown, Comprehensive Coverage.

---

## **Steps**

### **Phase 1: Structure & Foundation**

1. **Create Root Agent Documentation**
    - `.agents/` directory (new) with:
        - `.agents/README.md` – Overview of all agent docs
        - `.agents/AGENT_CONTEXT.md` – For all AI-tools (Copilot, Claude, etc.)
        - `.agents/GLOSSARY.md` – Foundry VTT + Ilaris terms
        - `.agents/CODEBASE_ARCHITECTURE.md` – Project structure for agents

2. **Create GitHub-Specific Agent Docs**
    - `.github/agents/` directory (new) with:
        - `.github/agents/README.md` – GitHub Copilot integration specifics
        - `.github/agents/COPILOT_EXTENSIONS.md` – Skills, custom tools (if relevant)
        - References back to `.copilot/` for shared context

3. **Expand Main Documentation** (refactor existing docs)
    - Update `AGENT_INSTRUCTIONS.md`: Restructure + link to new `.copilot/` structure
    - Update `CONTRIBUTING.md`: Add section "For Developers Using AI Agents"

### **Phase 2: Core Agent Knowledge**

4. **Create `.copilot/AGENT_CONTEXT.md`**
    - **Section A: Project Overview** (what, why, who)
        - Ilaris as Foundry VTT system (role-playing game mechanics)
        - Core value proposition
    - **Section B: Getting Started for Agents** (setup, key files)
        - Workspace structure (scripts/, styles/, comp_packs/, etc.)
        - Development workflow (npm scripts from package.json)
        - Key entry points: scripts/actors/sheets/actor.js, scripts/items/, etc.
    - **Section C: Common Tasks & Patterns** (where agents help most)
        - Adding new Actor/Item types
        - Creating UI sheets
        - Integrating with Foundry hooks

5. **Create `.agents/GLOSSARY.md`**
    - **Foundry VTT Core**: Document, Actor, Item, Scene, User, Wall, etc.
    - **Ilaris-Specific**: Analyze CHANGELOG.md, README.md for domain terms
        - Likely: Charaktere (Characters), Fertigkeiten (Skills), Zauber (Spells), Waffen (Weapons), etc.
    - **Codebase Terms**: Sheet, Hook, Socket, Migration, etc.

6. **Create `.agents/CODEBASE_ARCHITECTURE.md`**
    - **Directory Map** (High-level):
        - `scripts/` → Core system logic (actors, items, effects, etc.)
        - `styles/` → LESS/CSS theming
        - `comp_packs/` → Compendium data (fertigkeiten, zauber, etc.)
        - `assets/` → Images, fonts, game-icons
        - `docs/` → User & developer documentation
    - **Key Files** (what agents need to know):
        - `system.json` → Configuration
        - `template.json` → Data schemas
        - `scripts/actors/sheets/actor.js` → Primary actor UI
        - `scripts/items/` → Item types & sheets
    - **Design Patterns**:
        - How are Hooks used? (Examples from code)
        - How are Sheets structured? (Class hierarchy)
        - Where do migrations live?

### **Phase 3: Comprehensive Developer Guides** (Expand docs/develop/)

7. **Create `.agents/CODE_CONVENTIONS.md`**
    - Analyze existing code style:
        - Naming: camelCase vs snake_case vs kebab-case per file type
        - Class/method conventions (from actual code examples)
        - Comment style, JSDoc patterns
    - Foundry-specific patterns (usage of `game.`, `CONFIG.`, Hooks)
    - German vs. English in code (labels, identifiers, comments)

8. **Create `.agents/PATTERNS_AND_EXAMPLES.md`**
    - **Pattern A: Creating a new Actor Type**
        - Step-by-step with actual code references
    - **Pattern B: Adding a new Sheet (UI)**
        - HTML/CSS structure example
    - **Pattern C: Adding Compendium Content**
        - JSON structure for items/spells/weapons
        - Using utils/pack-all.js
    - **Pattern D: Hooks & Events**
        - Where/how to hook into Foundry lifecycle

9. **Create `.agents/BUILD_AND_DEVELOPMENT.md`**
    - **Available npm Scripts** (from package.json):
        - Build pipeline explanation
        - Compendium tools (pack-all.js, update-compendium-stats.mjs)
        - Test running (jest setup)
    - **Local Development Setup**
        - Link to existing docs/develop/ tooling
        - Debugging tips for agents

### **Phase 4: GitHub-Specific Agent Integration**

10. **Create `.github/agents/README.md`**
    - Overview of GitHub Copilot integration
    - When to use: Copilot Chat vs. Subagents
    - Linking to shared `.agents/` context
    - Custom Copilot Extensions (if any planned)

11. **Create `.github/agents/COPILOT_FOCUS_AREAS.md`**
    - Recommended areas for agent optimization:
        - Compendium management (repetitive, pattern-based)
        - Sheet creation (similar structure, varying content)
        - Bug fixes (code search + linting)
    - Areas where Agents excel (vs. human code review)

### **Phase 5: Integration & Linking**

12. **Update `AGENT_INSTRUCTIONS.md`** (Remove generic, redirect to new structure)
    - Keep concise
    - Link to `.agents/README.md` as main entry point

13. **Add Agent Context Callouts**
    - Strategically place **"For AI Agents:"** sections in:
        - `CONTRIBUTING.md` → Dev setup for agents
        - `docs/foundry-basics.md` → Key concepts
        - `docs/develop/tools.md` → Build setup

---

## **Verification**

1. **Structure Integrity**
    - Run: `find .agents -name "*.md" | wc -l` → should have ≥6-8 docs
    - Verify all cross-links work (relative paths)

2. **Content Completeness Checklist**
    - ✅ Glossary covers ≥20 terms
    - ✅ CODEBASE_ARCHITECTURE references actual files/folders
    - ✅ CODE_CONVENTIONS based on 3+ actual code examples
    - ✅ PATTERNS_AND_EXAMPLES includes working examples with file references

3. **Agent Testing** (Manual)
    - Open VSCode, chat with Copilot: "What's the architecture of this system?"
    - Expect: Copilot references `.agents/CODEBASE_ARCHITECTURE.md` + synthesizes answer
    - Try a subagent task: "Add a new skill type"
    - Expect: Agent finds patterns, templates, conventions via docs

---

## **Decisions Made**

- **Location**: `.agents/` for AI-tool-agnostic content; `.github/agents/` for GitHub Copilot specifics (mirrors your other project)
- **Language**: English throughout (industry standard, easier for global contributors)
- **Format**: Pure Markdown + relative links (VSCode-native, no extra tools needed)
- **Scope**: COMPREHENSIVE (all aspects of codebase, Foundry context, patterns) for maximum agent capability
- **Nested Docs**: Only in `docs/develop/` (existing structure); main agent UI docs in `.agents/`
- **Glossary**: Foundry VTT + Ilaris domain terms unified (agents need both)
- **Target AI Tools**: All (Copilot, Claude, other LLMs) with GitHub-specific notes where applicable

---

## **Next Steps**

- [ ] Research actual scripts/, styles/, comp_packs/ structure for real examples
- [ ] Extract code conventions from existing files (scripts/actors/sheets/actor.js, scripts/items/, etc.)
- [ ] Analyze system.json and template.json for data structure documentation
- [ ] Populate glossary from CHANGELOG.md, README.md, and existing code
- [ ] Create all `.agents/` markdown files
- [ ] Create all `.github/agents/` markdown files
- [ ] Update AGENT_INSTRUCTIONS.md
- [ ] Add "For AI Agents" sections to CONTRIBUTING.md and docs/foundry-basics.md
- [ ] Test agent context with agent Chat

---

## **Refinement (2026-03-10, Copilot Agent Model)**

### **Confirmed Decisions**

- **Primary runtime**: VS Code Agent Mode first
- **Agent topology**: Orchestrator model
    - `PLANNER` decomposes work and assigns execution tracks
    - Specialist agents execute
    - `REVIEWER` is final quality gate
- **Review strictness**: Balanced (blocks only on meaningful risk)
- **Skills/MCP**: Include immediately with an MVP skill set

### **GitHub Best-Practice Alignment (must-have)**

Based on GitHub Docs (custom instructions, custom agents, skills), the implementation should include:

1. **Repository-wide baseline instructions**

- `.github/copilot-instructions.md`
- Keep concise, stable, and non-task-specific

2. **Path-specific instructions for focused behavior**

- `.github/instructions/*.instructions.md` with frontmatter `applyTo`
- Use for JS/Foundry patterns, compendium content, styles/docs workflows

3. **Agent instructions for multi-tool compatibility**

- Root-level `AGENTS.md` for broad agent compatibility
- Optional nearest-scope `AGENTS.md` files for directory-specific behavior

4. **Custom agent profiles (Copilot coding agent)**

- `.github/agents/planner.md`
- `.github/agents/reviewer.md`
- `.github/agents/setup-specialist.md`
- Each profile includes YAML frontmatter (`name`, `description`) and a strict role prompt

5. **Agent skills (open Agent Skills spec)**

- `.github/skills/planning/`
- `.github/skills/review/`
- `.github/skills/foundry-setup/`
- Each skill includes reusable instructions/scripts/resources for repeatable flows

### **Refined Phase Plan (delta)**

#### **Phase A — Control Plane (Instructions & Precedence)**

- Add `.github/copilot-instructions.md` as global behavior baseline
- Add focused `.github/instructions/` files:
    - `foundry-js.instructions.md` → `applyTo: "scripts/**/*.js"`
    - `compendium.instructions.md` → `applyTo: "comp_packs/**,_source/**"`
    - `docs.instructions.md` → `applyTo: "docs/**/*.md"`
- Add root `AGENTS.md` for universal agent behavior and handoff contract
- Explicitly document precedence and conflict-avoidance rules

#### **Phase B — Dedicated Agents**

Create three dedicated profiles under `.github/agents/`:

1. **PLANNER**

- Goal: transform user intent into executable task graph
- Output contract:
    - scoped objective
    - assumptions + unknowns
    - step sequence
    - validation plan
    - delegation map (which specialist handles which step)

2. **REVIEWER**

- Goal: risk-based final check
- Must always evaluate:
    - correctness against task goal
    - regression risk
    - missing tests where appropriate
    - docs updates for behavioral changes
- Balanced gate:
    - block on high-confidence functional/security/regression risk
    - otherwise return actionable recommendations

3. **SETUP SPECIALIST**

- Goal: environment/bootstrap/tooling reliability
- Scope:
    - npm scripts and task flow
    - Foundry launch/setup routines
    - local dev validation sequences

#### **Phase C — Step-by-step Templates (required in prompts/skills)**

- **Planner template**: Clarify → Decompose → Assign → Define checks → Emit plan
- **Executor template**: Locate context → Implement minimal change → Validate → Report
- **Reviewer template**: Reconstruct intent → Diff-by-risk pass → Validation evidence → Gate decision
- **Setup template**: Detect environment → bootstrap sequence → failure recovery → verification output

### **Repository Additions (new target files)**

- `.github/copilot-instructions.md`
- `.github/instructions/foundry-js.instructions.md`
- `.github/instructions/compendium.instructions.md`
- `.github/instructions/docs.instructions.md`
- `AGENTS.md`
- `.github/agents/planner.md`
- `.github/agents/reviewer.md`
- `.github/agents/setup-specialist.md`
- `.github/skills/planning/...`
- `.github/skills/review/...`
- `.github/skills/foundry-setup/...`

### **Acceptance Criteria (refined)**

- Agent profiles are selectable and role behavior is visibly distinct in outputs
- Planner output always contains a deterministic execution plan + validation path
- Reviewer outputs deterministic gate decision: `PASS`, `PASS_WITH_NOTES`, or `BLOCK`
- Path-specific instructions are triggered in matching file areas (`scripts/`, `docs/`, `comp_packs/`)
- At least 2 MVP skills are usable in repeated tasks without reprompting

### **Implementation Note**

The previous structure using `.agents/` remains useful as human-readable, AI-tool-agnostic documentation. The execution-critical control plane for Copilot should be centered on `.github/copilot-instructions.md`, `.github/instructions/`, `.github/agents/`, and optional `AGENTS.md` files.

---

## **Reference Sources (GitHub + Standards)**

Use these as primary references while implementing and refining agent/subagent behavior:

- **GitHub Docs — About custom agents**
    - https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents
- **GitHub Docs — About agent skills**
    - https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- **GitHub Docs — Custom instructions support matrix**
    - https://docs.github.com/en/copilot/reference/custom-instructions-support
- **GitHub Docs — Using custom instructions (code review tutorial)**
    - https://docs.github.com/en/copilot/tutorials/use-custom-instructions
- **GitHub example repository — awesome-copilot**
    - https://github.com/github/awesome-copilot
    - Relevant examples: `task-researcher`, `task-planner`, reviewer patterns, orchestration/handoffs
- **Open Agent Skills spec + tooling**
    - https://github.com/agentskills/agentskills
    - https://agentskills.io/specification
- **Skill examples repository**
    - https://github.com/anthropics/skills

---

## **Mandatory Repo Additions (from refinement checklist)**

The following items are required and should be tracked as explicit implementation tasks.

### **A) Agent Profiles**

- Create dedicated role profiles under `.github/agents/`:
    - `planner.md`
    - `researcher.md`
    - `reviewer.md`
    - `setup-specialist.md`
- For each profile:
    - include clear role boundaries (what it must do / must not do)
    - define output contract (required sections in every response)
    - keep tools minimal and role-specific

### **B) Orchestrator + Handoffs**

- Define orchestrator flow (Planner → Specialist → Reviewer)
- Add explicit handoff contracts:
    - expected inputs
    - expected artifacts/files
    - required summary format back to orchestrator
- Ensure review gate is deterministic: `PASS`, `PASS_WITH_NOTES`, `BLOCK`

### **C) Skills**

- Create initial skills under `.github/skills/`:
    - `planning/`
    - `review/`
    - `foundry-setup/`
- Each skill includes at minimum:
    - `SKILL.md` with valid frontmatter (`name`, `description`)
    - step-by-step instructions
    - optional `scripts/`, `references/`, `assets/` where needed

### **D) Instructions Layering**

- Keep repository-wide baseline in `.github/copilot-instructions.md`
- Keep targeted behavior in `.github/instructions/*.instructions.md` using `applyTo`
- Keep broad multi-tool behavior in root `AGENTS.md`
- Avoid conflicts between these layers and document precedence in one place

### **E) Output Contracts + QA Checklists**

- Standardize output templates for:
    - research report
    - implementation plan
    - final review verdict
- Add a compact QA checklist for agent definitions:
    - clear purpose and non-overlapping scope
    - minimal required tools
    - unambiguous instructions
    - testable/demonstrable success criteria

### **F) Validation/Evaluation Loop**

- Add practical validation tasks for agent quality:
    - run at least 3 representative prompts per agent
    - verify role separation (no scope leakage)
    - verify handoff quality and artifact completeness
    - verify reviewer gate consistency across runs
