import type { Artifact, Issue, Project, WorkflowRun, WorkflowStep } from "./types";

const markdownArtifact = (
  id: string,
  name: string,
  title: string,
  sections: string[],
  versions = 1,
): Artifact => ({
  id,
  name,
  type: "markdown",
  versions: Array.from({ length: versions }, (_, index) => {
    const version = versions - index;
    return {
      version,
      label: version === versions ? "Current" : `v${version}`,
      createdAt: version === versions ? "Today, 09:14" : `Yesterday, ${10 + version}:22`,
      content: `# ${title}\n\n${sections
        .map((section, sectionIndex) => {
          const suffix =
            version === versions
              ? ""
              : `\n\n> This is an earlier version of the artifact (v${version}).`;
          return `## ${["Overview", "Findings", "Changes", "Next steps"][sectionIndex] ?? "Details"}\n\n${section}${suffix}`;
        })
        .join("\n\n")}`,
    };
  }),
});

export const artifacts = {
  analysis: markdownArtifact(
    "artifact-analysis",
    "issue-analysis.md",
    "OAuth issue analysis",
    [
      "The issue adds provider-based OAuth authentication while preserving the existing token flow.",
      "- Authentication middleware is the primary integration point\n- Provider configuration needs validation\n- Existing session behavior must remain unchanged",
      "The implementation should isolate provider-specific behavior behind a small adapter.",
    ],
  ),
  plan: markdownArtifact(
    "artifact-plan",
    "implementation-plan.md",
    "Implementation plan",
    [
      "Introduce OAuth provider configuration and route callbacks through the existing authentication boundary.",
      "1. Add provider configuration types\n2. Update authentication middleware\n3. Add callback handling\n4. Cover success and failure paths",
      "- `src/auth/middleware.ts`\n- `src/auth/providers.ts`\n- `src/config/schema.ts`\n- `tests/auth/oauth.test.ts`",
      "Review the provider interface, then begin implementation after approval.",
    ],
    3,
  ),
  affected: markdownArtifact(
    "artifact-files",
    "affected-files.md",
    "Affected files",
    [
      "The change is contained to authentication, configuration, and focused tests.",
      "| File | Change |\n| --- | --- |\n| `auth/providers.ts` | Add provider adapter |\n| `auth/middleware.ts` | Resolve OAuth callbacks |\n| `config/schema.ts` | Validate provider settings |",
    ],
  ),
  tests: markdownArtifact(
    "artifact-tests",
    "test-report.md",
    "Validation report",
    [
      "All targeted authentication tests passed after the callback-state fix.",
      "- 42 tests passed\n- 0 tests failed\n- Type check passed\n- OAuth callback coverage: 91%",
      "The implementation is ready for final review.",
    ],
    2,
  ),
  review: markdownArtifact(
    "artifact-review",
    "review-summary.md",
    "Review summary",
    [
      "The OAuth implementation follows the existing authentication boundaries and keeps provider logic isolated.",
      "- No blocking issues\n- Error states are surfaced consistently\n- Tests cover callback validation and provider failures",
      "Create the pull request and request review from the authentication owners.",
    ],
  ),
  pr: markdownArtifact(
    "artifact-pr",
    "pull-request.md",
    "Pull request draft",
    [
      "Add configurable OAuth providers and callback handling to Forge authentication.",
      "- Add provider adapter\n- Validate OAuth state\n- Preserve existing token authentication\n- Add focused tests",
      "Ready for engineering review.",
    ],
  ),
};

export const projects: Project[] = [
  {
    id: "forge-core",
    name: "Forge Core",
    shortName: "NC",
    repository: "github.com/progress/forge-core",
    description: "Core orchestration, authentication, and workflow services.",
  },
  {
    id: "app-builder",
    name: "AppBuilder",
    shortName: "AB",
    repository: "github.com/progress/app-builder",
    description: "Visual application creation and code generation.",
  },
  {
    id: "devtools",
    name: "DevTools",
    shortName: "DT",
    repository: "github.com/progress/devtools",
    description: "Developer tooling and diagnostics.",
  },
];

export const issues: Issue[] = [
  {
    id: "1842",
    projectId: "forge-core",
    title: "Add OAuth support",
    description:
      "Allow users to authenticate using OAuth providers while preserving the existing local token workflow. Include clear configuration and callback error handling.",
    status: "open",
    assignee: "Stefan",
    labels: ["authentication", "feature"],
  },
  {
    id: "1839",
    projectId: "forge-core",
    title: "Improve CLI diagnostics",
    description: "Make local engine connection failures easier to understand and resolve.",
    status: "open",
    assignee: "Yoan",
    labels: ["cli", "observability"],
  },
  {
    id: "1814",
    projectId: "forge-core",
    title: "Improve error handling",
    description: "Normalize workflow errors and surface actionable recovery guidance.",
    status: "open",
    assignee: "Elena",
    labels: ["reliability"],
  },
  {
    id: "1798",
    projectId: "forge-core",
    title: "Refactor config loader",
    description: "Separate source loading from schema validation.",
    status: "closed",
    assignee: "Stefan",
    labels: ["refactor"],
  },
  {
    id: "204",
    projectId: "app-builder",
    title: "Generate responsive page layouts",
    description: "Improve generated layout behavior at common desktop breakpoints.",
    status: "open",
    assignee: "Mira",
    labels: ["generation"],
  },
  {
    id: "198",
    projectId: "app-builder",
    title: "Preserve design tokens on import",
    description: "Map imported token names without flattening semantic groups.",
    status: "open",
    assignee: "Elena",
    labels: ["design-system"],
  },
  {
    id: "77",
    projectId: "devtools",
    title: "Add trace timeline",
    description: "Visualize command lifecycle events in diagnostics.",
    status: "open",
    assignee: "Yoan",
    labels: ["diagnostics"],
  },
];

const step = (
  id: string,
  name: string,
  description: string,
  status: WorkflowStep["status"],
  options: Partial<WorkflowStep> = {},
): WorkflowStep => ({
  id,
  name,
  description,
  status,
  artifacts: [],
  ...options,
});

export const workflowSteps = (): WorkflowStep[] => [
  step("understand", "Understand issue", "Analyze the issue, repository context, and constraints.", "pending"),
  step("plan", "Create plan", "Produce an implementation plan and identify affected files.", "pending"),
  step("approval", "Review plan", "Wait for human approval before implementation.", "pending"),
  step("implement", "Implement", "Apply the planned changes with the selected coding agent.", "pending"),
  step("validate", "Validate", "Run focused tests and check the implementation.", "pending"),
  step("review", "Review & create PR", "Review the result and prepare the pull request.", "pending"),
];

export const initialWorkflows: WorkflowRun[] = [
  {
    id: "wf-oauth-running",
    projectId: "forge-core",
    issueId: "1842",
    workflowName: "Issue → Pull Request",
    startedBy: "Stefan",
    execution: "local",
    agent: "GitHub Copilot",
    status: "running",
    startedAt: "Today, 09:02",
    steps: [
      step("understand", "Understand issue", "Analyzed requirements and repository context.", "completed", {
        duration: "48s",
        artifacts: [artifacts.analysis],
      }),
      step("plan", "Create plan", "Produced an implementation plan and affected file list.", "completed", {
        duration: "1m 23s",
        artifacts: [artifacts.plan, artifacts.affected],
      }),
      step("approval", "Review plan", "Implementation plan approved by Stefan.", "completed", {
        duration: "36s",
      }),
      step("implement", "Implement", "Apply the planned authentication changes.", "running", {
        progress: 64,
        activity: "Updating authentication middleware and OAuth callback handling…",
      }),
      step("validate", "Validate", "Run focused tests and checks.", "pending"),
      step("review", "Review & create PR", "Review changes and create a pull request.", "pending"),
    ],
  },
  {
    id: "wf-error-waiting",
    projectId: "forge-core",
    issueId: "1814",
    workflowName: "Issue → Pull Request",
    startedBy: "Elena",
    execution: "cloud",
    agent: "GitHub Copilot",
    status: "waiting",
    startedAt: "Today, 08:41",
    steps: [
      step("understand", "Understand issue", "Analyzed error handling gaps.", "completed", {
        duration: "51s",
        artifacts: [artifacts.analysis],
      }),
      step("plan", "Create plan", "Created a staged error-handling plan.", "completed", {
        duration: "1m 12s",
        artifacts: [artifacts.plan, artifacts.affected],
      }),
      step("approval", "Review plan", "Approval is required before implementation.", "waiting", {
        activity: "Waiting for your approval",
        artifacts: [artifacts.plan],
      }),
      step("implement", "Implement", "Apply the approved changes.", "pending"),
      step("validate", "Validate", "Run focused tests.", "pending"),
      step("review", "Review & create PR", "Review and prepare a pull request.", "pending"),
    ],
  },
  {
    id: "wf-cli-failed",
    projectId: "forge-core",
    issueId: "1839",
    workflowName: "Issue → Pull Request",
    startedBy: "Yoan",
    execution: "local",
    agent: "GitHub Copilot",
    status: "failed",
    startedAt: "Yesterday, 16:20",
    validationRetried: false,
    steps: [
      step("understand", "Understand issue", "Analyzed diagnostic output.", "completed", {
        duration: "44s",
        artifacts: [artifacts.analysis],
      }),
      step("plan", "Create plan", "Planned diagnostic improvements.", "completed", {
        duration: "1m 05s",
        artifacts: [artifacts.plan],
      }),
      step("approval", "Review plan", "Plan approved.", "completed", { duration: "12s" }),
      step("implement", "Implement", "Implemented structured diagnostic output.", "completed", {
        duration: "6m 18s",
      }),
      step("validate", "Validate", "Run focused CLI tests.", "failed", {
        message: "3 tests failed: connection timeout messages did not include recovery guidance.",
      }),
      step("review", "Review & create PR", "Review and prepare a pull request.", "pending"),
    ],
  },
  {
    id: "wf-config-complete",
    projectId: "forge-core",
    issueId: "1798",
    workflowName: "Issue → Pull Request",
    startedBy: "Stefan",
    execution: "local",
    agent: "GitHub Copilot",
    status: "completed",
    startedAt: "Aug 29, 14:12",
    steps: [
      step("understand", "Understand issue", "Analyzed configuration loading.", "completed", {
        duration: "39s",
        artifacts: [artifacts.analysis],
      }),
      step("plan", "Create plan", "Planned the loader refactor.", "completed", {
        duration: "1m 08s",
        artifacts: [artifacts.plan, artifacts.affected],
      }),
      step("approval", "Review plan", "Plan approved.", "completed", { duration: "18s" }),
      step("implement", "Implement", "Separated loading and validation.", "completed", {
        duration: "8m 31s",
      }),
      step("validate", "Validate", "All checks passed.", "completed", {
        duration: "2m 17s",
        artifacts: [artifacts.tests],
      }),
      step("review", "Review & create PR", "Pull request created.", "completed", {
        duration: "1m 04s",
        artifacts: [artifacts.review, artifacts.pr],
      }),
    ],
  },
  {
    id: "wf-layout-paused",
    projectId: "app-builder",
    issueId: "204",
    workflowName: "Issue → Pull Request",
    startedBy: "Mira",
    execution: "cloud",
    agent: "GitHub Copilot",
    status: "paused",
    startedAt: "Today, 08:52",
    steps: [
      step("understand", "Understand issue", "Analyzed generated layout behavior.", "completed", {
        duration: "52s",
        artifacts: [artifacts.analysis],
      }),
      step("plan", "Create plan", "Planned responsive generation changes.", "completed", {
        duration: "1m 44s",
        artifacts: [artifacts.plan],
      }),
      step("approval", "Review plan", "Plan approved.", "completed", { duration: "22s" }),
      step("implement", "Implement", "Update layout generation templates.", "paused", {
        progress: 38,
        activity: "Paused by Mira while reviewing generated output.",
      }),
      step("validate", "Validate", "Run generation tests.", "pending"),
      step("review", "Review & create PR", "Review and prepare a pull request.", "pending"),
    ],
  },
];
