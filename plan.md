# Forge Local Control Center Visual Prototype Plan

## 1. Purpose

Build a high-fidelity, stateful **React + TypeScript visual prototype** of the Forge Local Control Center.

The prototype is intended for UX and cross-team discussion. It is **not** a production implementation and must not integrate with the real Forge engine, repositories, issue providers, authentication, agents, or cloud infrastructure.

The prototype should make the following experience tangible:

1. A user enters Forge and sees the projects they work on.
2. Selecting a project shows project activity, including currently running workflows.
3. The user can browse issues in the selected project.
4. Selecting an issue lets the user start a workflow.
5. The prototype should also explore issue-level Forge commands such as Ask and Issue Draft, clearly labeled as a **concept / future exploration** because individual command UI is outside the current MVP scope.
6. Running work shows progress and status.
7. Workflows expose their individual stages/steps and the current step.
8. Users can visually exercise pause, resume, retry/restart, cancel, approval, rejection, and input states.
9. Each workflow step can expose one or more generated artifacts.
10. Markdown artifacts can be reviewed inside the Control Center without navigating away.
11. The UI shows who initiated a workflow, its status, linked issue, execution location, and progress.

The primary UX question the prototype should help answer is:

> Can a user understand what Forge is doing, why it stopped, what it produced, and what they can do next, without understanding the CLI?

---

## 2. Prototype Principles

### 2.1 Visual prototype, not backend implementation

Fake all external behavior.

Do **not** implement:

- Real Forge engine integration
- GitHub/Azure DevOps/Jira integration
- Real repository access
- Real workflow execution
- Real agent execution
- Real Markdown generation
- Real authentication
- Real role enforcement
- Real Cloud Agent infrastructure
- Persistent backend storage
- Real configuration files
- Source-code editing

Use local mock data and simulated state transitions.

### 2.2 Optimize for UX exploration

The prototype should prioritize:

- Information hierarchy
- Navigation
- Workflow visibility
- Status communication
- Human intervention
- Artifact discovery
- Workflow-to-issue relationships
- Project-level visibility

### 2.3 Forge should not look like a chat application

The dominant visual model should be **controlled workflow execution**, not conversation.

Primary visual concepts:

- Projects
- Issues
- Workflow runs
- Workflow stages
- Status
- Progress
- Human checkpoints
- Artifacts
- Execution environment

AI is executing inside the workflow. It should not dominate the entire product shell as a chatbot.

---

## 3. Technical Approach

### Required stack

- React
- TypeScript
- Vite or equivalent lightweight React development setup
- CSS/CSS Modules or the existing component styling approach

If KendoReact is already available in the environment, reuse it where convenient. Do not introduce it solely for the prototype if it creates setup friction.

### State management

Keep state simple.

Preferred options:

1. React Context + hooks
2. A very small lightweight store if already available

Do not introduce Redux solely for this prototype.

### Routing

Use React Router or equivalent client-side routing.

Suggested routes:

```text
/
/projects/:projectId
/projects/:projectId/issues
/projects/:projectId/issues/:issueId
/projects/:projectId/workflows
/projects/:projectId/workflows/:workflowId
/projects/:projectId/settings
```

---

## 4. Information Architecture

```text
Forge Control Center
│
├── Projects
│   ├── Project
│   │   ├── Overview
│   │   ├── Issues
│   │   │   └── Issue Detail
│   │   ├── Workflows
│   │   │   └── Workflow Detail
│   │   └── Configuration
│   │
│   └── Other Projects
│
└── User / Prototype Role
```

The core relationship is:

```text
Project
  ↓
Issue
  ↓
Workflow Run
  ↓
Workflow Steps
  ↓
Artifacts
```

Treat **workflow → steps → artifacts** as the primary operational model.

---

## 5. Application Shell

Create a desktop-oriented application shell.

### Left sidebar

Persistent project navigation approximately 240-280px wide.

Example:

```text
forge

PROJECTS

● Forge Core
  3 running

○ AppBuilder
  1 running

○ DevTools
  No active runs

────────────────

+ Add project

Settings
```

Requirements:

- Show all mock projects.
- Highlight the selected project.
- Show a subtle active-workflow indicator/count per project where applicable.
- Include an Add Project action for visual completeness. It does not need real persistence.

### Top bar

Example:

```text
Forge Core                       Local engine ●       Stefan ▾
```

Possible elements:

- Current project name
- Local/Cloud connection indicator
- Notification indicator for workflows requiring intervention
- User avatar/name
- Current prototype role

Do not implement real authentication.

---

## 6. Project Overview Screen

Route:

```text
/projects/:projectId
```

Navigation tabs:

```text
Overview | Issues | Workflows | Configuration
```

The Overview page should answer:

> What is currently happening in this project?

### Main sections

#### Active workflows

Show workflow summary cards or compact list items.

Example:

```text
Issue #1842 · Add OAuth support
Issue → PR Workflow

● Running    Implementing                       64%
██████████████████████████░░░░░░░░

Started by Stefan      Local      12 min
```

Another example:

```text
Issue #1814 · Improve error handling
Issue → PR Workflow

◉ Needs input     Review
Started by Elena       Cloud Agent
```

Each item should be clickable and open Workflow Detail.

#### Recent workflows

Show recently completed/failed/cancelled workflow runs in a more compact list.

---

## 7. Issues Screen

Route:

```text
/projects/:projectId/issues
```

Display a searchable/filterable issue list.

Example:

```text
Issues                                      Search...

ID     Issue                           Status      Forge
1842   Add OAuth support               Open        Running
1839   Improve CLI diagnostics         Open        —
1814   Improve error handling          Open        Input
1798   Refactor config loader          Closed      Done
```

Clicking an issue opens the Issue Detail screen.

Do not implement a real external issue system.

---

## 8. Issue Detail Screen

Route:

```text
/projects/:projectId/issues/:issueId
```

Example layout:

```text
‹ Issues

#1842  Add OAuth support

OPEN   assigned to Stefan

Allow users to authenticate using OAuth...

──────────────────────────────────────────────

Forge

[ Run workflow ]        [ Run command ▾ ]

Previous runs

● Issue → PR     Running     64%
✓ Issue draft    Completed
✓ Ask            Completed
```

### Required behavior

- Run Workflow opens Start Workflow Dialog.
- Run Command opens the experimental command picker.
- Previous runs link to their run details/artifacts.

### Scope label

Individual Forge commands are exploratory and outside current MVP scope.

Display a small visual label such as:

```text
CONCEPT
```

or

```text
Future exploration
```

near the command functionality so the prototype does not imply committed MVP scope.

---

## 9. Start Workflow Dialog

Trigger from Issue Detail.

Example:

```text
Start workflow

Workflow
[ Issue → Pull Request             ▾ ]

Execution
(•) Local
( ) Cloud Agent

Coding agent
[ GitHub Copilot                   ▾ ]

                           Cancel   Start workflow
```

### Prototype behavior

When Start Workflow is clicked:

1. Create a new workflow object in local state.
2. Associate it with the selected project and issue.
3. Add it to the project's workflow list.
4. Navigate to the new Workflow Detail screen.
5. Start the fake workflow simulation.

---

## 10. Project Workflow Monitor

Route:

```text
/projects/:projectId/workflows
```

This is the main project-level workflow-monitoring screen.

Suggested filters:

```text
All | Running | Needs input | Completed | Failed
```

Suggested layout:

```text
Workflow      Issue                    Started by   Status      Step
Issue → PR    #1842 OAuth support      Stefan       Running     3/6
Issue → PR    #1814 Error handling     Elena        Input       4/6
Code review   #1802 Config             Yoan         Running     2/4
Issue → PR    #1798 Config loader      Stefan       Done        6/6
```

Each row opens Workflow Detail.

Show at minimum:

- Workflow name
- Linked issue
- Initiating user
- Status
- Current step
- Execution location
- Progress where meaningful

---

## 11. Workflow Detail Screen

Route:

```text
/projects/:projectId/workflows/:workflowId
```

This should be the visual centerpiece of the prototype.

### Header

Example:

```text
Issue → Pull Request
#1842 · Add OAuth support

● Running       Local       Started by Stefan
```

Include workflow-level actions when relevant:

- Pause
- Resume
- Cancel

### Workflow timeline

Use a vertical timeline/stepper.

Example:

```text
✓  1. Understand issue
│     Completed · 48s
│     📄 issue-analysis.md
│
✓  2. Create plan
│     Completed · 1m 23s
│     📄 implementation-plan.md
│
●  3. Implement
│     Running · 64%
│
│     Agent is modifying authentication...
│     ████████████████████░░░░░░░░
│
│     [ Pause ]
│
○  4. Validate
│
○  5. Review
│
○  6. Create PR
```

### Step status semantics

Use icon + text + color.

Suggested semantics:

```text
● blue    Running
✓ green   Completed
◉ amber   Needs input
Ⅱ gray    Paused
! red     Failed
○ gray    Pending
```

Do not rely on color alone.

---

## 12. Workflow Step Details

Every workflow step should be expandable/clickable.

### Completed step

Example:

```text
✓ Create implementation plan

Completed in 1m 23s

The planning agent analyzed the issue and repository
and produced an implementation plan.

ARTIFACTS

📄 implementation-plan.md             View
📄 affected-files.md                   View

Details
Agent        GitHub Copilot
Execution    Local

[ Retry step ]
```

### Running step

```text
● Implement

Running · 64%

Current activity
Updating authentication middleware...

████████████████████░░░░░░░

[ Pause workflow ]     [ Cancel workflow ]
```

### Paused step

```text
Ⅱ Implement

Paused

[ Resume ]     [ Restart step ]     [ Cancel ]
```

### Failed step

```text
! Validate

Failed

3 tests failed during validation.

[ View details ]

[ Retry step ]     [ Cancel workflow ]
```

For the prototype these messages are mocked.

---

## 13. Human Checkpoint / Approval State

The prototype must include at least one workflow that pauses for human interaction.

Example:

```text
◉ Review plan

Waiting for your approval

Forge created an implementation plan.

📄 implementation-plan.md

──────────────────────────────────

Review the plan before implementation continues.

[ Reject ]    [ Request changes ]    [ Approve ]
```

### Behavior

- Approve advances the workflow to the next step.
- Reject updates the workflow to a rejected/cancelled state or a clearly mocked alternative state.
- Request Changes can open a small textarea and then simulate returning to the prior planning step.

The exact backend behavior is not important. The visual transition is.

---

## 14. Artifact Experience

Workflow outputs should be first-class objects.

Artifacts belong to individual workflow steps.

A step may contain zero, one, or multiple artifacts.

Example artifact list:

```text
ARTIFACTS (3)

📄 implementation-plan.md
📄 affected-files.md
📄 test-report.md
```

Clicking an artifact opens an Artifact Drawer.

---

## 15. Artifact Drawer

Use a right-side drawer/modal panel so users keep workflow context while reviewing an artifact.

Example:

```text
┌──────────────────────────────────────┐
│ implementation-plan.md          ×   │
│                                      │
│ Version: Current ▾                   │
│                                      │
│ Implementation Plan                  │
│                                      │
│ ## Overview                          │
│ Introduce OAuth support in the...    │
│                                      │
│ ## Changes                           │
│ 1. Add provider configuration        │
│ 2. Update authentication middleware  │
│ 3. Add tests                         │
│                                      │
└──────────────────────────────────────┘
```

### Markdown

Render mock Markdown as formatted content.

A lightweight Markdown renderer may be used.

### Versions

The prototype should demonstrate version history.

Example:

```text
Version
Current ▾

v3 Current
v2
v1
```

Selecting a version swaps the hard-coded content.

No editing is required.

---

## 16. Experimental Forge Commands

This section exists to explore UX ideas and should be visibly labeled as non-MVP concept functionality.

From Issue Detail:

```text
Run command ▾
```

Possible mock commands:

```text
Ask Forge
Issue draft
Review
```

Command picker example:

```text
Run Forge command                  CONCEPT

┌──────────────────────────┐
│ ✦ Ask Forge                │
│ Ask about this issue     │
└──────────────────────────┘

┌──────────────────────────┐
│ 📝 Issue draft            │
│ Generate issue draft     │
└──────────────────────────┘
```

### Ask flow

```text
Ask Forge

Issue
#1842 Add OAuth support

Question
[ What parts of authentication need to change? ]

                                      Run
```

After Run:

```text
Ask Forge                         ● Running

Analyzing issue...
███████████████░░░░░░░░

Artifacts will appear here.
```

Then:

```text
Ask Forge                         ✓ Completed

Artifacts
📄 forge-response.md               View
```

Use the same artifact viewer as workflows.

Do not create a separate artifact interaction model for commands.

---

## 17. Project Configuration Screen

Route:

```text
/projects/:projectId/settings
```

Keep this intentionally shallow.

Show visual sections for:

```text
Project settings

Repository
Integrations
Coding agents
Models
Workflows
```

These can contain representative form controls but do not need persistent or functional integrations.

The purpose is simply to show where configuration would live in the product architecture.

---

## 18. Prototype Role Simulation

Add a development/demo-only role switcher.

Example:

```text
Prototype role
[ Read-only | Active | Admin ]
```

### Read-only

Can:

- Browse projects
- Browse issues
- View workflows
- View workflow status
- Open artifacts
- Review previous artifact versions

Cannot:

- Start workflows
- Run commands
- Pause/resume/retry/cancel workflows
- Approve/reject steps
- Change project configuration

Disable or hide mutating controls consistently.

### Active

Can:

- Start workflows
- Monitor workflows
- Control workflow execution
- Interact with approval/input states
- Review artifacts
- Use the experimental command UI for prototype purposes

### Admin

Everything available to Active plus access to project configuration UI.

Do not implement actual entitlement or security enforcement. This is a UX simulation only.

---

## 19. Mock Domain Types

Use explicit TypeScript models.

Example:

```ts
type WorkflowStatus =
  | "running"
  | "paused"
  | "waiting"
  | "failed"
  | "completed"
  | "cancelled";

type StepStatus =
  | "pending"
  | "running"
  | "paused"
  | "waiting"
  | "failed"
  | "completed";

type ArtifactVersion = {
  version: number;
  content: string;
  createdAt: string;
};

type Artifact = {
  id: string;
  name: string;
  type: "markdown";
  versions: ArtifactVersion[];
};

type WorkflowStep = {
  id: string;
  name: string;
  description?: string;
  status: StepStatus;
  progress?: number;
  activity?: string;
  artifacts: Artifact[];
};

type WorkflowRun = {
  id: string;
  projectId: string;
  issueId: string;
  workflowName: string;
  startedBy: string;
  execution: "local" | "cloud";
  agent?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  startedAt: string;
};

type Issue = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "open" | "closed";
  assignee?: string;
};

type Project = {
  id: string;
  name: string;
  repository: string;
};
```

Adjust types when useful, but keep the conceptual relationships intact.

---

## 20. Suggested React Component Structure

```text
src/
│
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── PrototypeContext.tsx
│
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx
│   │   ├── ProjectSidebar.tsx
│   │   └── TopBar.tsx
│   │
│   ├── workflow/
│   │   ├── WorkflowStatusBadge.tsx
│   │   ├── WorkflowProgress.tsx
│   │   ├── WorkflowTimeline.tsx
│   │   ├── WorkflowStep.tsx
│   │   ├── WorkflowControls.tsx
│   │   └── WorkflowSummary.tsx
│   │
│   ├── artifacts/
│   │   ├── ArtifactDrawer.tsx
│   │   ├── ArtifactList.tsx
│   │   ├── ArtifactVersionSelector.tsx
│   │   └── MarkdownViewer.tsx
│   │
│   ├── issues/
│   │   ├── IssueList.tsx
│   │   └── IssueHeader.tsx
│   │
│   └── common/
│       ├── StatusBadge.tsx
│       ├── ProgressBar.tsx
│       └── EmptyState.tsx
│
├── pages/
│   ├── ProjectOverview.tsx
│   ├── IssuesPage.tsx
│   ├── IssueDetailPage.tsx
│   ├── WorkflowsPage.tsx
│   ├── WorkflowDetailPage.tsx
│   └── ProjectSettingsPage.tsx
│
├── dialogs/
│   ├── StartWorkflowDialog.tsx
│   ├── RunCommandDialog.tsx
│   └── ApprovalInputDialog.tsx
│
├── data/
│   └── mockData.ts
│
├── simulation/
│   └── workflowSimulator.ts
│
└── types/
    └── domain.ts
```

The exact directory structure may be adjusted to match the existing project conventions.

---

## 21. Seed Data

Create at least 3 representative projects.

Example:

```text
Forge Core
AppBuilder
DevTools
```

Give each project several issues.

Seed workflows specifically to demonstrate these UX states.

### Scenario A: Normal running workflow

```text
Issue → PR
Step 3/6
Implementing
64%
```

### Scenario B: Waiting for approval/input

```text
Issue → PR
Step 2/6
Plan approval required
```

### Scenario C: Failed workflow

```text
Issue → PR
Step 4/6
Validation failed
Retry available
```

### Scenario D: Completed workflow

```text
Issue → PR
6/6
Completed
Multiple artifacts
```

### Scenario E: Paused workflow

```text
Issue → PR
Step 3/6
Paused by user
Resume available
```

These scenarios should exist immediately when the prototype loads so they can be demonstrated without first generating them manually.

---

## 22. Workflow Simulation

Implement a lightweight fake workflow engine in the browser.

It should mutate prototype state using timers.

Example conceptual sequence:

```text
Start workflow
    ↓
Understand issue: running
    ↓
Understand issue: completed
    ↓
Create plan: running
    ↓
Create plan: completed
    ↓
Review plan: waiting
    ↓
User approves
    ↓
Implement: running
    ↓
Validate: failed
    ↓
User retries
    ↓
Validate: completed
    ↓
Review: completed
    ↓
Create PR: completed
    ↓
Workflow completed
```

### Important

The simulation does not need to represent real Forge timing or execution semantics.

Its purpose is to exercise UI states.

### Supported simulated actions

Implement visual behavior for:

- Start workflow
- Pause workflow
- Resume workflow
- Cancel workflow
- Retry failed step
- Restart step
- Approve checkpoint
- Reject checkpoint
- Request changes
- Open generated artifact

---

## 23. Artifact Generation Simulation

When simulated steps complete, attach predefined artifacts.

Example:

### Understand issue

```text
issue-analysis.md
```

### Create plan

```text
implementation-plan.md
affected-files.md
```

### Validate

```text
test-report.md
```

### Review

```text
review-summary.md
```

Artifacts should contain realistic sample Markdown suitable for presenting the UI.

Some artifacts should have multiple versions so version switching can be demonstrated.

---

## 24. Empty and Secondary States

Include basic visual treatment for:

### Project with no workflows

```text
No workflows are running in this project.

Select an issue to start a Forge workflow.
```

### Issue with no previous Forge activity

```text
No Forge runs for this issue yet.

[ Run workflow ]
```

### Step with no artifacts

```text
No artifacts were produced by this step.
```

### Cancelled workflow

Clearly distinguish cancelled from failed.

---

## 25. Responsive Expectations

Optimize primarily for desktop screens.

Target approximately:

```text
1280px and wider
```

The prototype does not need a polished mobile experience.

At narrower desktop sizes:

- Sidebar may collapse.
- Artifact drawer may widen over content.
- Tables may become scrollable.

Do not spend excessive effort on mobile responsiveness.

---

## 26. Accessibility Baseline

Even as a prototype:

- Use semantic buttons.
- Use meaningful labels.
- Do not communicate workflow status using color alone.
- Ensure selected navigation has non-color indication.
- Keep readable contrast.
- Allow keyboard activation of major controls where practical.

---

## 27. Visual Direction

Aim for a calm developer-tool/control-center aesthetic.

Prefer:

- Neutral surfaces
- Clear hierarchy
- Compact but readable density
- Subtle borders
- Restrained elevation
- Status color used intentionally
- Monospace sparingly for IDs/file names/technical metadata

Avoid:

- Large marketing-style cards
- Excessive gradients
- Generic AI sparkle effects everywhere
- Chat bubbles as the core experience
- Overly playful animation

The workflow timeline and artifacts should be visually stronger than decorative AI branding.

---

## 28. Implementation Order

Follow this sequence.

### Phase 1: Shell and navigation

Implement:

```text
AppShell
ProjectSidebar
TopBar
Routing
ProjectOverview
IssuesPage
WorkflowsPage
```

Use mock data immediately.

### Phase 2: Workflow visualization

Implement:

```text
WorkflowDetailPage
WorkflowTimeline
WorkflowStep
WorkflowStatusBadge
ProgressBar
WorkflowControls
```

Make sure all seeded workflow states render correctly before adding simulation.

### Phase 3: Artifact experience

Implement:

```text
ArtifactList
ArtifactDrawer
MarkdownViewer
ArtifactVersionSelector
```

Verify multiple artifacts and multiple versions.

### Phase 4: Simulated workflow execution

Implement browser-side state transitions for:

```text
Start
Pause
Resume
Retry
Restart
Cancel
Approve
Reject
Request changes
```

### Phase 5: Issue-to-workflow creation

Wire the complete flow:

```text
Issue Detail
    ↓
Start Workflow Dialog
    ↓
Create WorkflowRun
    ↓
Workflow Detail
    ↓
Workflow appears in project workflow monitor
```

### Phase 6: Experimental command UI

Add:

```text
Run Command
Ask Forge
Issue Draft
Command progress
Command artifacts
```

Clearly mark command functionality as Concept/Future Exploration.

### Phase 7: Role simulation

Implement the demo role switcher and adjust controls for:

```text
Read-only
Active
Admin
```

### Phase 8: Presentation polish

Finish:

- Empty states
- Tooltips
- Status consistency
- Spacing
- Hover/focus states
- Seed scenario quality
- Demo reset function

---

## 29. Demo Reset

Add a small development/demo action such as:

```text
Reset demo
```

This restores the original seeded state.

It can live inside a prototype-only menu.

This is useful because workflow interactions modify the mock state during presentations.

---

## 30. Primary End-to-End Demo Journey

Optimize the prototype for this exact presentation path:

```text
1. Open Forge.
2. See several projects in the project sidebar.
3. Select Forge Core.
4. Immediately see workflows currently running in that project.
5. Open Issues.
6. Select #1842 "Add OAuth support".
7. Click Run workflow.
8. Select Issue → Pull Request.
9. Choose Local execution.
10. Start the workflow.
11. See the workflow appear in project activity.
12. Open Workflow Detail.
13. Watch workflow stages progress.
14. Planning completes.
15. Open implementation-plan.md from the planning step.
16. Review the Markdown artifact in the side drawer.
17. Close the artifact drawer without losing workflow context.
18. Workflow reaches a human approval checkpoint.
19. Approve the checkpoint.
20. Implementation continues.
21. Validation enters a failed state.
22. Retry the validation step.
23. Validation succeeds.
24. Workflow completes.
25. Review the final set of artifacts.
```

If this journey feels clear and coherent, the prototype is successful.

---

## 31. Secondary UX Journeys

Also make these easy to demonstrate.

### Read-only observer

```text
Switch role to Read-only
→ Open project
→ Open running workflow
→ Review progress
→ Open artifacts
→ Verify execution/control buttons are unavailable
```

### Needs-input discovery

```text
Open project
→ Notice Needs input indicator
→ Filter workflows to Needs input
→ Open workflow
→ Understand what decision is required
```

### Experimental command

```text
Open issue
→ Run command
→ Choose Ask Forge
→ Enter mock question
→ Run
→ See progress
→ Open forge-response.md
```

---

## 32. Non-Goals

Do not allow the prototype to expand into production engineering.

Explicit non-goals:

- Full CLI replacement
- Real command execution
- Real workflow engine
- Real project setup
- Real user management
- Real role assignment
- Real licensing
- Real model configuration
- Real coding-agent configuration
- Real repository handling
- Real local service
- Tauri/Electron packaging unless already required by the host repository
- Real Cloud Agent integration
- Organization-level observability dashboards
- Usage/cost analytics
- Policy/governance implementation
- Source-code editor

---

## 33. Acceptance Criteria

The visual prototype is complete when all of the following are true.

### Navigation

- User can switch between mock projects.
- User can browse Project Overview, Issues, Workflows, and Configuration.
- User can open an issue.
- User can open a workflow.

### Project visibility

- Project Overview clearly shows active workflow activity.
- Workflow Monitor shows who started each workflow, status, linked issue, execution location, and step/progress.

### Workflow execution

- User can start a simulated workflow from an issue.
- Newly started workflows appear in the selected project's workflow monitor.
- Workflow steps visually progress over time.

### Workflow control

- Prototype demonstrates Pause.
- Prototype demonstrates Resume.
- Prototype demonstrates Cancel.
- Prototype demonstrates Retry/Restart.
- Prototype demonstrates a human approval/input state.

### Artifacts

- Completed steps can expose artifacts.
- A step can expose multiple artifacts.
- Markdown opens inside the product in a right-side drawer/panel.
- Multiple artifact versions can be viewed.
- Closing the artifact viewer keeps the user on the same workflow.

### Commands

- Experimental issue command UI is present.
- It is clearly visually marked as Concept/Future Exploration.
- A command can simulate progress and produce a Markdown artifact.

### Roles

- Prototype role can be switched between Read-only, Active, and Admin.
- Read-only users cannot visually mutate workflows.
- Active users can execute/control workflows.
- Admin users can access the project configuration concept.

### Demo quality

- Initial seed data already contains Running, Waiting, Failed, Completed, and Paused workflow examples.
- Demo can be reset to its original state.
- No real backend is required to exercise the primary demo journey.

---

## 34. Final Product Mental Model

The interface should communicate this hierarchy naturally:

```text
PROJECT
   │
   ├── ISSUES
   │      │
   │      └── START WORK
   │
   └── WORKFLOW RUNS
           │
           ├── STEP
           │    └── ARTIFACTS
           │
           ├── STEP
           │    └── HUMAN CHECKPOINT
           │
           ├── STEP
           │    └── ARTIFACTS
           │
           └── OUTCOME
```

At every point the user should be able to answer four questions quickly:

1. **What is Forge doing?**
2. **Where is it in the workflow?**
3. **Does Forge need anything from me?**
4. **What has Forge produced so far?**

Design and implementation decisions in this prototype should be judged primarily against those four questions.
