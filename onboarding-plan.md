# Forge Control Center First-Time Setup Prototype Plan

## 1. Purpose

Extend the React + TypeScript visual prototype so it starts with the **first-time user journey**, before any projects are configured.

The user must be guided from an empty Forge installation to a configured first project. After setup, the user enters the existing project, issue, workflow, progress, and artifact experience.

This remains a **visual prototype only**. Use mock data and simulated checks. Do not access the real filesystem, run shell commands, authenticate with external services, create TOML files, or call Forge.

## 2. Core Entry Logic

```text
Application starts
  ↓
Are projects configured?
  ├── No  → Welcome and first-project setup
  └── Yes → Last selected project / Project Overview
```

Use local React state or local storage to simulate whether setup has been completed.

Provide a prototype-only **Reset demo** action that clears projects and returns to the first-time Welcome screen.

## 3. First-Time User Journey

```text
Welcome
  ↓
Check environment
  ↓
Add first project
  ↓
Select local repository
  ↓
Configure code platform
  ↓
Configure issue tracker
  ↓
Select coding agent
  ↓
Select model profile
  ↓
Confirm project metadata
  ↓
Review and validate
  ↓
Project ready
  ↓
Open Project Overview
```

## 4. Setup Routes

```text
/setup/welcome
/setup/project
/setup/code-platform
/setup/issue-tracker
/setup/coding-agent
/setup/model-profile
/setup/project-details
/setup/review
/setup/complete
```

Normal product routes remain unchanged.

## 5. Welcome Screen

Route:

```text
/setup/welcome
```

Suggested content:

```text
Welcome to Forge

Set up your first project to connect its repository,
issue tracker, coding agent, and project context.

[ Add your first project ]

Already use Forge in this repository?
[ Import existing configuration ]

Prototype only: [ Load demo workspace ]
```

Behavior:

- **Add your first project** starts the setup wizard.
- **Import existing configuration** uses a simulated folder choice and shows detected configuration for review.
- **Load demo workspace** bypasses setup and loads the seeded projects/workflows from the main prototype.
- Do not show the normal product sidebar before the first project exists.

## 6. Setup Wizard Layout

Use a full-page setup flow, not a small modal.

Persistent stepper:

```text
1 Project
2 Code platform
3 Issue tracker
4 Coding agent
5 Model profile
6 Project details
7 Review
```

Layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Forge                                             Setup        │
├──────────────────────────────────────────────────────────────┤
│ 1 Project  2 Code  3 Issues  4 Agent  5 Model  6 Details   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Step title                                                   │
│ Short explanation                                            │
│                                                              │
│ Step controls                                                │
│                                                              │
│                         [ Back ] [ Continue ]                 │
└──────────────────────────────────────────────────────────────┘
```

Requirements:

- Preserve entered values between steps.
- Validate required fields inline.
- Each step has Back and Continue.
- Cancel warns that setup data will be discarded.
- Create the project only after Review and validation.

## 7. Step 1: Environment and Project Source

Route:

```text
/setup/project
```

### 7.1 Simulated environment check

Show the setup prerequisites as visual statuses:

```text
Environment check

✓ Forge installed
✓ Local Git repository support available
✓ GitHub CLI available
✓ Node.js available

[ Run check again ]
```

Also implement a missing-prerequisite state:

```text
! Coding agent prerequisite not detected

You can continue configuring the project, but setup
must be completed before a workflow can run.

[ View setup guidance ]   [ Check again ]
```

All checks are mocked. Never execute real commands.

### 7.2 Select setup mode

```text
Add your first project

(•) Use a local repository
    Select a repository already cloned on this machine.

( ) Import an existing Forge configuration
    Use a repository that already contains .forge/config.
```

### 7.3 Select local repository

```text
Project folder
[ /Users/stefan/work/healthcare-app-angular ] [ Browse ]

Detected
✓ Git repository
✓ Repository name: healthcare-app-angular
✓ Remote: GitHub
```

Use a fake folder picker with predefined repository options.

### 7.4 Import existing setup

Simulate detection of:

```text
.forge/config/agents.toml
.forge/config/project.toml
.forge/config/toolchain.toml
```

If detected, prefill the later wizard steps but allow the user to review and change all values.

## 8. Step 2: Code Platform

Route:

```text
/setup/code-platform
```

Ask where the code is hosted.

```text
Where is your source code hosted?

[ GitHub ]
[ Bitbucket ]
[ Local only ]
[ Other / Not connected ]
```

GitHub is the primary polished path.

### GitHub state

```text
GitHub

Repository
[ telerik/healthcare-app-angular          ▾ ]

Connection
✓ Connected as Stefan

[ Change account ]
```

### Local-only state

```text
Local only

Forge will use the selected local Git repository without
connecting to an external code platform.
```

Requirements:

- Keep local repository and code platform as separate concepts.
- Preserve the repository selected earlier.
- Support mock Connected, Authentication required, and Failed states.
- Do not perform OAuth or API calls.

## 9. Step 3: Issue Tracker

Route:

```text
/setup/issue-tracker
```

Options:

```text
GitHub Issues
Jira
Azure DevOps
Shortcut
Local only
Other integrations
```

Implement detailed prototype paths for **GitHub Issues** and **Local only**. Other providers may show representative mocked fields.

### GitHub Issues

```text
GitHub Issues

Repository
[ telerik/healthcare-app-angular ]

✓ Issues available

[ Test connection ]
```

### Jira example

```text
Jira

Site URL
[ https://example.atlassian.net ]

Project key
[ FORGE ]

[ Connect ]
```

### Local only

```text
Local issues

Use local issue context without connecting to an
external issue-tracking system.
```

Behavior:

- Preselect GitHub Issues when GitHub is the code platform.
- Allow the user to change it.
- Do not force code platform and issue tracker to be the same.
- Simulate Connected, Needs authentication, Failed, and Not connected.

## 10. Step 4: Coding Agent

Route:

```text
/setup/coding-agent
```

Primary choices:

```text
GitHub Copilot
Claude Code
OpenCode
```

Each agent card shows:

- Agent name
- Short neutral description
- Installed / Not detected
- Authenticated / Authentication required

Example:

```text
GitHub Copilot

✓ Installed
✓ Authenticated through GitHub

[ Use GitHub Copilot ]
```

Alternate state:

```text
Claude Code

! Authentication required

Authentication must be completed before workflows can run.

[ View setup guidance ]   [ Check again ]
```

Behavior:

- Store the selected agent in setup state.
- **Check again** changes a predefined mock state.
- **View setup guidance** opens a drawer with static guidance and a documentation link.
- Do not install or authenticate an agent.

## 11. Step 5: Model Profile

Route:

```text
/setup/model-profile
```

Options:

```text
Stable
Default profile

Balanced
Balanced capability and usage

Lite
Lower-cost experimentation
```

Preselect **Stable**.

Keep this at profile level. Do not introduce detailed model-by-model configuration during first-time setup.

## 12. Step 6: Project Metadata

Route:

```text
/setup/project-details
```

Required fields:

```text
Project name
Project description
Primary language
Frameworks
Testing framework
Package manager
```

Suggested form:

```text
Tell Forge about this project

Project name *
[ healthcare-app-angular ]

Description *
[ Healthcare sample application ]

Primary language *
[ TypeScript                         ▾ ]

Frameworks *
[ Angular, RxJS                         ]

Testing framework *
[ Jest                                  ]

Package manager *
[ npm                                ▾ ]
```

Simulate repository detection and prefill suggested values.

Label them:

```text
Suggested from repository
```

All values remain editable. Continue is disabled until every required field is provided.

## 13. Step 7: Review and Validate

Route:

```text
/setup/review
```

Example:

```text
Review project setup

PROJECT
healthcare-app-angular
/Users/stefan/work/healthcare-app-angular
                                             Edit

CODE PLATFORM
GitHub · telerik/healthcare-app-angular
Connected
                                             Edit

ISSUE TRACKER
GitHub Issues
Connected
                                             Edit

CODING AGENT
GitHub Copilot
Installed · Authenticated
                                             Edit

MODEL PROFILE
Stable
                                             Edit

PROJECT DETAILS
TypeScript · Angular · Jest · npm
                                             Edit
```

Optionally show which conceptual configuration files would exist:

```text
.forge/config/agents.toml
.forge/config/project.toml
.forge/config/toolchain.toml
```

Do not show raw TOML by default. A secondary **Preview configuration** action may open a read-only conceptual preview.

Primary action:

```text
[ Validate and add project ]
```

Simulated validation sequence:

```text
Validating repository...
Validating integrations...
Validating coding agent...
Validating project metadata...
```

Success proceeds to Setup Complete.

Error example:

```text
Setup needs attention

! GitHub Issues connection could not be validated.

[ Back to Issue tracker ]   [ Try again ]
```

## 14. Setup Complete

Route:

```text
/setup/complete
```

```text
Your project is ready

healthcare-app-angular has been added to Forge.

✓ Repository configured
✓ Issue tracker configured
✓ Coding agent selected
✓ Project context complete

[ Open project ]

[ Review configuration ]
```

**Open project** must:

1. Add the new project to local prototype state.
2. Add it to the project sidebar.
3. Enter the normal Control Center shell.
4. Navigate to the new Project Overview.

## 15. Returning User and Add Another Project

When at least one project exists, open the standard application shell.

The sidebar's **Add project** action reuses the same wizard with the title:

```text
Add another project
```

Differences:

- Cancel returns to the existing project.
- User-level defaults, such as coding agent and model profile, may be prefilled.
- Completion opens the new project's Overview.

Do not create a separate wizard.

## 16. Setup State Model

```ts
type ConnectionStatus =
  | "not_checked"
  | "checking"
  | "connected"
  | "needs_authentication"
  | "failed";

type SetupMode = "new" | "import";

type CodePlatform = "github" | "bitbucket" | "local" | "other";

type IssueTracker =
  | "github_issues"
  | "jira"
  | "azure_devops"
  | "shortcut"
  | "local"
  | "other";

type CodingAgent = "github_copilot" | "claude_code" | "opencode";

type ModelProfile = "stable" | "balanced" | "lite";

type ProjectMetadata = {
  name: string;
  description: string;
  language: string;
  frameworks: string[];
  testingFramework: string;
  packageManager: string;
};

type ProjectSetupState = {
  step: number;
  mode: SetupMode;
  localPath: string;
  repositoryDetected: boolean;
  existingConfigurationDetected: boolean;
  codePlatform: CodePlatform;
  codePlatformStatus: ConnectionStatus;
  issueTracker: IssueTracker;
  issueTrackerStatus: ConnectionStatus;
  codingAgent: CodingAgent;
  agentInstalled: boolean;
  agentAuthenticated: boolean;
  modelProfile: ModelProfile;
  metadata: ProjectMetadata;
  validationStatus: "idle" | "validating" | "valid" | "invalid";
};
```

Use React Context and hooks or the prototype's existing lightweight state store.

## 17. React Components

```text
src/
├── setup/
│   ├── SetupLayout.tsx
│   ├── SetupStepper.tsx
│   ├── WelcomePage.tsx
│   ├── ProjectSourceStep.tsx
│   ├── EnvironmentCheck.tsx
│   ├── CodePlatformStep.tsx
│   ├── IssueTrackerStep.tsx
│   ├── CodingAgentStep.tsx
│   ├── ModelProfileStep.tsx
│   ├── ProjectMetadataStep.tsx
│   ├── SetupReviewStep.tsx
│   ├── SetupValidation.tsx
│   ├── SetupCompletePage.tsx
│   ├── ConnectionStatus.tsx
│   └── SetupGuidanceDrawer.tsx
```

Reuse the prototype's existing buttons, cards, badges, fields, drawer, and status components.

## 18. Mock Data

Repository choices:

```text
/Users/stefan/work/healthcare-app-angular
/Users/stefan/work/project-forge
/Users/stefan/work/new-project
```

Synthetic detected metadata for the primary demonstration:

```text
Name: healthcare-app-angular
Description: Healthcare sample application
Language: TypeScript
Frameworks: Angular, RxJS
Testing framework: Jest
Package manager: npm
```

Keep these values clearly inside prototype mock data. They are not real repository analysis.

Provide deterministic states for:

- Connected
- Authentication required
- Connection failed
- Recheck succeeds
- Configuration detected
- Configuration not detected
- Validation succeeds
- Validation fails

## 19. Implementation Order

### Phase 1: Entry state and routing

- Add no-project detection.
- Add setup routes.
- Make Welcome the default first-time page.
- Add Reset demo and Load demo workspace.

### Phase 2: Wizard shell

- Build SetupLayout.
- Build SetupStepper.
- Implement Back, Continue, Cancel, and preserved state.

### Phase 3: Project source

- Build mocked environment check.
- Build local repository picker.
- Build import-existing-configuration path.

### Phase 4: Integrations

- Build code-platform selection.
- Build issue-tracker selection.
- Add connection status variants.

### Phase 5: Execution preferences

- Build coding-agent selection.
- Add mocked install/authentication states.
- Build model-profile selection.

### Phase 6: Project context

- Build project metadata form.
- Add synthetic detected suggestions.
- Add validation for required values.

### Phase 7: Review and completion

- Build Review screen.
- Add edit links to previous steps.
- Add simulated validation.
- Add success/error states.
- Create project in prototype state.
- Navigate into Project Overview.

### Phase 8: Returning-user flow

- Reuse the wizard from Add project.
- Prefill user-level choices where appropriate.
- Ensure Cancel returns to the existing workspace.

## 20. Primary End-to-End Demo

```text
1. Open Forge with no configured projects.
2. See Welcome.
3. Select Add your first project.
4. Review the mocked environment check.
5. Select a local Git repository.
6. Choose GitHub as the code platform.
7. Choose GitHub Issues as the issue tracker.
8. Select GitHub Copilot.
9. Select the Stable model profile.
10. Review/edit detected project metadata.
11. Review the complete setup.
12. Select Validate and add project.
13. Watch simulated validation.
14. See Your project is ready.
15. Select Open project.
16. Enter Project Overview.
17. Continue with the existing issue-to-workflow prototype journey.
```

## 21. Acceptance Criteria

### First-time entry

- No-project state opens Welcome rather than an empty dashboard.
- Add your first project is the primary action.
- The demo workspace can still be loaded for presentations.

### Required setup

- User can select a simulated local repository.
- User can import a simulated existing Forge configuration.
- User can choose a code platform.
- User can independently choose an issue tracker.
- User can select GitHub Copilot, Claude Code, or OpenCode.
- User can select Stable, Balanced, or Lite.
- User can review/edit project name, description, language, frameworks, testing framework, and package manager.
- User can review all decisions before creating the project.

### State coverage

- Environment checks support success and missing-prerequisite states.
- Connections support Connected, Authentication required, and Failed.
- Validation supports loading, success, and actionable failure.

### Completion

- Completing setup creates a project in local prototype state.
- The project appears in the sidebar.
- Open project navigates to Project Overview.
- Add project reuses the wizard after onboarding.
- Reset demo returns to first-time state.

### Scope control

- No shell commands are executed.
- No repository is scanned.
- No real authentication occurs.
- No external API is called.
- No real Forge configuration is created.
- No TOML file is modified.

## 22. UX Success Questions

The setup should let a first-time user answer:

1. **What project am I adding?**
2. **Where is its code hosted?**
3. **Where do its issues come from?**
4. **Which coding agent will Forge use?**
5. **What project context will Forge provide to the agent?**
6. **Is the setup ready, or what still needs attention?**
7. **What happens after setup is complete?**

The onboarding is successful when the transition from an empty installation to the first Project Overview is clear and does not require CLI knowledge.
