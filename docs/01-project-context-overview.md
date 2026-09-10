# Project Context Overview

## Product Intent

The prototype demonstrates a Forge/Progress Forge control center where users can:

1. Configure project context and integrations.
2. Browse project issues.
3. Run and monitor Issue -> PR workflows.
4. Intervene when workflows need approval or recovery.
5. Inspect generated markdown artifacts.

The core UX question from planning docs is whether users can understand what the system is doing, why it stopped, what it produced, and what to do next without CLI expertise.

## Scope Boundaries (Prototype Only)

The project intentionally uses mock data and simulated behavior:

- No real Forge engine integration
- No real repository scanning
- No real issue tracker integration
- No real coding-agent execution
- No real authentication or cloud runtime
- No real TOML or config file creation

## Experience Model

Primary hierarchy:

1. Project
2. Issue
3. Workflow run
4. Workflow step
5. Artifact

This makes the product operational and workflow-driven rather than chat-first.

## Navigation Shape

Main routes are split into setup and project areas:

- Setup flow for first-time/add-project paths
- Project shell with tabs: Overview, Issues, Workflows, Configuration (admin)
- Detailed issue and workflow pages with intervention actions

## Source-of-Truth Planning

Two planning documents guide behavior:

- `plan.md`: broad visual prototype architecture and IA
- `onboarding-plan.md`: detailed first-time setup and onboarding states

Attached onboarding flow diagram adds an explicit two-phase model:

1. One-time setup phase (requirements + coding-agent readiness)
2. Per-project recurring phase (project + tracker + config + issue-to-PR run)
