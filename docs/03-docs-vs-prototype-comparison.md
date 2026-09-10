# Docs vs Prototype Comparison

## Comparison Basis

Compared the current implementation against:

- `plan.md`
- `onboarding-plan.md`
- Attached onboarding flow diagram (one-time setup + per-project loop)

## Alignment Summary

Overall alignment is good on architecture and flow mechanics, with the largest deltas in explicit gating language and decision-branch visibility from the diagram.

## Direct Matches

1. First-time onboarding exists and can be default entry when no projects exist.
2. Setup is full-page, multi-step, with persisted state and back/continue flow.
3. Setup includes project source, platform, issue tracker, coding agent, model profile, metadata, and review.
4. Mock connection states and setup validation success/failure are implemented.
5. Returning users can add another project via reused wizard.
6. Project -> Issue -> Workflow -> Steps -> Artifacts model is implemented.
7. Workflow interventions (pause/resume/retry/restart/approve/reject/request changes) are implemented.

## Partial Matches

1. Requirements check exists, but does not yet feel like a strict precondition gate in product language.
2. Coding-agent readiness is represented but not clearly separated as a global one-time setup concept.
3. Import existing configuration is represented as mock detection, but conceptual config-file lifecycle is not deeply surfaced in UX.
4. Review/validation sequence exists, but config confirmation framing could be stronger.

## Gaps Against Diagram-Driven Narrative

1. Decision-node visibility
- Diagram emphasizes explicit yes/no branches at key checkpoints.
- App mostly presents statuses and actions without a clear "decision node" pattern.

2. One-time setup vs per-project boundary
- Diagram separates these as two distinct phases.
- App flow includes both but with less explicit phase boundaries.

3. License/entitlement branch
- Diagram shows a branch requiring paid license for Issue-to-PR workflow path.
- Prototype currently lacks explicit entitlement gating and fallback narrative.

4. Outcome framing
- Diagram highlights "first real outcome" as a milestone.
- App transitions to project dashboard but does not emphasize this milestone state.

5. Operational warnings and loop-back messaging
- Diagram has clear warn/loop-back markers.
- Prototype has warning states, but loop-back pathways are less explicit as a patterned UX language.

## Practical Interpretation

The current app is stronger as an operational control-center prototype than as a strict onboarding flowchart implementation. It is close in functional intent, but not yet equivalent in narrative structure and decision-branch communication.
