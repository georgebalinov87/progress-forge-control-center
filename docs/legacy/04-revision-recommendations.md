# Revision Recommendations to Match Docs

## Goal

Align the prototype with the agreed Forge onboarding UX while keeping it strictly visual and simulated.

No real functionality should be planned or implemented for repository checks, authentication, integrations, or command execution. Every branch must be demo-controlled.

## Mock-Only Principle

1. All checks are represented as simulated states, never live checks.
2. Every major branch is user-switchable through explicit demo controls.
3. Messaging clearly states: prototype simulation only.

## Agreed Flows

1. First-time flow (initialize project)
- Configure a repository that does not yet have Forge setup.

2. Existing flow (new user joins)
- Open an already configured Forge project and review existing settings/data.

## Setup Step Order

1. Project
2. Coding agent
3. Code platform
4. Issue tracker
5. Project details
6. Review

## Home Screen and Setup Changes

1. Remove import button and import wording from welcome/start flow.
2. Remove "project setup mode" section and replace with direct flow/scenario selection.
3. Project step behavior is simulated:
- GitHub repo without Forge config -> continue setup flow
- GitHub repo with existing Forge project -> skip setup and open dashboard
- Invalid repo/folder -> blocked state with loop-back actions
4. Code platform options are one-row and no longer include "Local only".
5. Issue tracker options remove "Shortcut" and "Local only" and stay one-row.
6. Coding agent step merges model profile cards in the same screen.
7. Project details uses text inputs only.

## Demo Strategy for Both Scenarios

Use a scenario-driven simulation panel in the Project step:

1. Preset: first-time initialize
2. Preset: join existing project
3. Preset: blocked folder check

Each preset sets all relevant step states so demos are repeatable and fast.

## Simulation Matrix (Required)

The demo should allow toggling each state independently:

1. Environment readiness
- ready
- blocked

2. Repo detection
- valid new Forge setup
- valid existing Forge setup
- invalid/non-GitHub

3. Coding agent
- installed + authenticated
- installed + needs auth
- not installed

4. Code platform connection
- connected
- needs authentication
- failed
- not checked

5. Issue tracker connection
- connected
- needs authentication
- failed
- not checked

6. Final review validation
- success
- simulated failure

## Dashboard and Workflow Follow-ups

1. Keep the Configuration tab as the place to edit all setup outcomes.
2. Add progressive disclosure for configuration sections so content is not overloaded.
3. Keep all future workflow/artifact changes simulation-only as well.

## Acceptance Checks

1. Demo can switch between initialize and join flows in under 10 seconds.
2. All checkpoint branches can be shown without external services.
3. Skip-to-dashboard behavior is demonstrable from the Project step.
4. Blocked states are clearly visible and recoverable with loop-back actions.
5. No screen implies real execution; simulation language is explicit.
