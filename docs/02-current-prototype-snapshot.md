# Current Prototype Snapshot

## Tech and Runtime

- React + TypeScript + Vite
- Local in-memory/context state
- Mock data seeded from `src/data.ts`
- Provider/state orchestration in `src/prototype.tsx`
- Build status at snapshot: passing (`npm run build`)

## App Composition

### 1. Setup Flow (`src/setup.tsx`)

Implemented setup routes and steps:

1. Welcome
2. Project source + environment check
3. Code platform
4. Issue tracker
5. Coding agent
6. Model profile
7. Project details
8. Review
9. Complete

Key implemented behaviors:

- Simulated environment checks and missing-prerequisite state
- New vs import mode for project setup
- Mock local repository selection
- Simulated integration connection statuses
- Coding-agent install/auth states with guidance drawer
- Editable metadata with required field validation
- Simulated review validation sequence with success/failure branch
- "Add project" flow reuse for returning users

### 2. Project Shell and Workflow UX (`src/App.tsx`)

Implemented user-facing areas:

- Sidebar project navigation and role selector
- Topbar with local-engine and notifications affordances
- Project tabs and page routing
- Overview metrics and active/recent workflow views
- Issue list, filtering, and issue detail
- Workflow detail and step-level status UI
- Artifact drawer for markdown outputs

### 3. Workflow Simulation Engine (`src/prototype.tsx`)

Implemented operational behavior:

- Start workflow from issue
- Step progression and simulated progress updates
- State transitions: running, paused, waiting, failed, completed, cancelled
- Human intervention actions:
  - pause/resume
  - cancel
  - retry/restart step
  - approve/reject
  - request changes
- Artifact assignment by step
- Demo workspace load/reset behavior

### 4. Seeded Content (`src/data.ts`)

Includes:

- Mock projects
- Mock issues
- Mock workflow runs across statuses
- Mock markdown artifacts and versions
- Reusable workflow step template

## What Is Strong Today

- End-to-end visual journey is demonstrable.
- Workflow model is explicit and interactive.
- Setup onboarding is already substantial and close to plan.
- Failure, waiting, and approval states are represented.
- Artifact inspection exists in context of workflow stages.

## Known Prototype Constraints

- Deterministic mock transitions only (no real backend state)
- No persistent server-side project/workflow data
- No real licensing, auth, or entitlement checks
- No real command execution behind setup checks
