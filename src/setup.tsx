import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Cloud,
  Code2,
  ExternalLink,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Github,
  HelpCircle,
  Hammer,
  LoaderCircle,
  Package,
  Play,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  WandSparkles,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { usePrototype } from "./prototype";
import type {
  CodePlatform,
  CodingAgent,
  ConnectionStatus,
  IssueTracker,
  ModelProfile,
  Project,
  ProjectMetadata,
  SetupMode,
} from "./types";

type RepositoryScenario = "new_forge" | "existing_forge" | "not_repo";
type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

type SetupState = {
  mode: SetupMode;
  localPath: string;
  repositoryUrl: string;
  environmentReady: boolean;
  repositoryScenario: RepositoryScenario;
  existingProjectId: string;
  codePlatform: CodePlatform;
  codePlatformStatus: ConnectionStatus;
  issueTracker: IssueTracker;
  issueTrackerStatus: ConnectionStatus;
  codingAgent: CodingAgent;
  agentStates: Record<CodingAgent, { installed: boolean; authenticated: boolean }>;
  modelProfile: ModelProfile;
  metadata: ProjectMetadata;
  validationStatus: ValidationStatus;
  validationMessage?: string;
};

const repositoryOptions = [
  "/Users/stefan/work/healthcare-app-angular",
  "/Users/stefan/work/project-forge",
  "/Users/stefan/work/new-project",
];

const steps = [
  { path: "welcome", label: "Repository" },
  { path: "coding-agent", label: "Coding agent" },
  { path: "issue-tracker", label: "Issue tracker" },
  { path: "project-details", label: "Project details" },
  { path: "review", label: "Review" },
];

const platformLabels: Record<CodePlatform, string> = {
  github: "GitHub",
  bitbucket: "Bitbucket",
  gitlab: "GitLab",
  other: "Other",
};

const trackerLabels: Record<IssueTracker, string> = {
  github_issues: "GitHub Issues",
  jira: "Jira",
  azure_devops: "Azure DevOps",
  other: "Other integrations",
};

const agentLabels: Record<CodingAgent, string> = {
  github_copilot: "GitHub Copilot",
  claude_code: "Claude Code",
  opencode: "OpenCode",
};

const modelLabels: Record<ModelProfile, string> = {
  stable: "Stable",
  balanced: "Balanced",
  lite: "Lite",
};

const initialState = (): SetupState => ({
  mode: "initialize",
  localPath: "",
  repositoryUrl: "",
  environmentReady: false,
  repositoryScenario: "new_forge",
  existingProjectId: "forge-core",
  codePlatform: "github",
  codePlatformStatus: "connected",
  issueTracker: "github_issues",
  issueTrackerStatus: "connected",
  codingAgent: "github_copilot",
  agentStates: {
    github_copilot: { installed: true, authenticated: true },
    claude_code: { installed: true, authenticated: false },
    opencode: { installed: false, authenticated: false },
  },
  modelProfile: "stable",
  metadata: {
    name: "healthcare-app-angular",
    description: "Healthcare sample application",
    language: "TypeScript",
    frameworks: ["Angular", "RxJS"],
    testingFramework: "Jest",
    packageManager: "npm",
  },
  validationStatus: "idle",
});

export function SetupFlow() {
  const { projects, loadDemoWorkspace, addProject, showDemoControls } = usePrototype();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<SetupState>(initialState);
  const [guidance, setGuidance] = useState<string | null>(null);
  const returnTo = searchParams.get("returnTo") ?? projects[0]?.id;
  const isReturning = projects.length > 0;

  const cancel = () => {
    if (!window.confirm("Discard the setup information entered so far?")) return;
    navigate(isReturning && returnTo ? `/projects/${returnTo}` : "/setup/welcome");
  };

  const openExistingProject = () => {
    if (!projects.length) loadDemoWorkspace();
    navigate(`/projects/${state.existingProjectId}`);
  };

  const currentPath = location.pathname.split("/").pop() ?? "welcome";
  const currentIndex = steps.findIndex((step) => step.path === currentPath);
  const wizardVisible = currentIndex >= 0;
  const showSetupHeader = currentPath !== "welcome";

  return (
    <div className="setup-shell">
      {showSetupHeader && (
        <header className="setup-topbar">
          <div className="setup-brand">
            <span className="setup-brand-mark"><Hammer size={16} /></span>
            <span>
              <strong>forge</strong>
              <small>Control Center</small>
            </span>
          </div>
          {wizardVisible && <SetupStepper current={currentIndex} compact />}
          <span className="setup-mode-label">{isReturning ? "Add project" : "First-time setup"}</span>
        </header>
      )}
      <main className={showSetupHeader ? "setup-main" : "setup-main welcome-main"}>
        <Routes>
          <Route
            path="welcome"
            element={
              <WelcomePage
                state={state}
                setState={setState}
                showDemoControls={showDemoControls}
                onProceed={() => {
                  if (state.repositoryScenario === "existing_forge") {
                    openExistingProject();
                    return;
                  }
                  navigate(withReturn("/setup/coding-agent", returnTo));
                }}
              />
            }
          />
          <Route
            path="coding-agent"
            element={
              <CodingAgentStep
                state={state}
                setState={setState}
                onGuidance={(agent) => setGuidance(agent)}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/welcome", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/issue-tracker", returnTo))}
                  />
                }
              />
            }
          />
          <Route
            path="issue-tracker"
            element={
              <IssueTrackerStep
                state={state}
                setState={setState}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/coding-agent", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/project-details", returnTo))}
                  />
                }
              />
            }
          />
          <Route
            path="project-details"
            element={
              <ProjectDetailsStep
                state={state}
                setState={setState}
                footer={
                  <SetupFooter
                    onBack={() => navigate(withReturn("/setup/issue-tracker", returnTo))}
                    onCancel={cancel}
                    onContinue={() => navigate(withReturn("/setup/review", returnTo))}
                    disabled={!metadataValid(state.metadata)}
                  />
                }
              />
            }
          />
          <Route
            path="review"
            element={
              <ReviewStep
                state={state}
                setState={setState}
                returnTo={returnTo}
                onBack={() => navigate(withReturn("/setup/project-details", returnTo))}
                onCancel={cancel}
                onValidated={(project) => {
                  flushSync(() => {
                    addProject(project);
                  });
                  navigate(`/projects/${project.id}`);
                }}
              />
            }
          />
          <Route
            path="complete"
            element={
              <Navigate to={withReturn("/setup/review", returnTo)} replace />
            }
          />
          <Route
            index
            element={<Navigate to="/setup/welcome" replace />}
          />
          <Route path="*" element={<Navigate to="/setup/welcome" replace />} />
        </Routes>
      </main>
      {guidance && <GuidanceDrawer topic={guidance} onClose={() => setGuidance(null)} />}
    </div>
  );
}

function withReturn(path: string, returnTo?: string) {
  return returnTo ? `${path}?returnTo=${returnTo}` : path;
}

function SetupStepper({ current, compact = false }: { current: number; compact?: boolean }) {
  return (
    <nav className={`setup-stepper ${compact ? "compact" : ""}`} aria-label="Setup progress">
      {steps.map((step, index) => (
        <div
          key={step.path}
          className={`setup-step ${index === current ? "current" : ""} ${index < current ? "complete" : ""}`}
        >
          <span>{index < current ? <Check size={13} /> : index + 1}</span>
          <strong>{step.label}</strong>
          {index < steps.length - 1 && <i />}
        </div>
      ))}
    </nav>
  );
}

function WelcomePage({
  state,
  setState,
  showDemoControls,
  onProceed,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  showDemoControls: boolean;
  onProceed: () => void;
}) {
  const [checkState, setCheckState] = useState<"idle" | "checking" | "done">("idle");
  const hasRepoSelection = Boolean(state.localPath.trim());

  useEffect(() => {
    if (!hasRepoSelection || checkState !== "idle") return;
    runCheck(state.repositoryScenario);
  }, [checkState, hasRepoSelection, state.repositoryScenario]);

  const runCheck = (scenario: RepositoryScenario) => {
    setCheckState("checking");
    setState((current) => ({
      ...current,
      mode: scenario === "existing_forge" ? "join" : "initialize",
      repositoryScenario: scenario,
      environmentReady: false,
    }));
    window.setTimeout(() => {
      setState((current) => ({
        ...current,
        mode: scenario === "existing_forge" ? "join" : "initialize",
        repositoryScenario: scenario,
        environmentReady: scenario !== "not_repo",
      }));
      setCheckState("done");
    }, 550);
  };

  const browse = () => {
    const mockPath = repositoryOptions[0];
    setCheckState("idle");
    setState((current) => ({
      ...current,
      localPath: mockPath,
      repositoryUrl: "",
      environmentReady: false,
    }));
  };

  const scenarioLabel =
    state.repositoryScenario === "existing_forge"
      ? "Existing Forge project detected (simulated)"
      : state.repositoryScenario === "new_forge"
        ? "GitHub repository without Forge setup detected (simulated)"
        : "Selected folder is not a valid GitHub repository (simulated)";

  const selectedAgentState = state.agentStates[state.codingAgent];

  const continueDisabled =
    !state.environmentReady ||
    state.repositoryScenario === "not_repo" ||
    !selectedAgentState.installed ||
    !selectedAgentState.authenticated;

  const continueLabel =
    state.repositoryScenario === "existing_forge" ? "Load existing project" : "Setup new project";

  return (
    <div className="welcome-card">
      <div className="welcome-visual">
        <span className="welcome-logo"><Hammer size={22} /></span>
        <div className="welcome-orbit one"><Folder size={18} /></div>
        <div className="welcome-orbit two"><Github size={18} /></div>
        <div className="welcome-orbit three"><Bot size={18} /></div>
      </div>
      <span className="setup-eyebrow">Get started</span>
      <h1>Welcome to Forge</h1>
      <p>
        Choose a local repository. Forge will auto-detect whether an existing
        .forge project is present and start the correct flow.
      </p>
      <label className="setup-field">
        <span>Repository folder</span>
        <div className="folder-picker">
          <FolderOpen size={16} />
          <input value={state.localPath} placeholder="Choose a local repository" readOnly />
          <button type="button" onClick={browse}>Browse</button>
        </div>
      </label>
      {hasRepoSelection && <div className="home-checks">
        <div className={`environment-card ${state.environmentReady ? "ready" : "warning"}`}>
          <div className="environment-heading">
            <span>
              {checkState === "checking" ? <LoaderCircle size={20} /> : state.environmentReady ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}
            </span>
            <div>
              <strong>
                {checkState === "checking"
                  ? "Running simulated checks..."
                  : state.environmentReady
                    ? "Environment and repository are ready"
                    : "Checks need attention"}
              </strong>
              <p>
                {checkState === "checking"
                  ? "Validating repository and prerequisites."
                  : checkState === "idle"
                    ? "Select a repository first."
                    : state.environmentReady
                      ? "Forge can continue for the selected setup path."
                      : "Continue is blocked until checks pass."}
              </p>
            </div>
          </div>
          <div className="check-grid">
            <CheckItem label="Forge extension installed" ok={checkState === "done"} />
            <CheckItem label="Local Git support" ok={checkState === "done"} />
            <CheckItem label="Repository is valid" ok={checkState === "done" && state.repositoryScenario !== "not_repo"} />
            <CheckItem label="Forge config detected" ok={checkState === "done" && state.repositoryScenario === "existing_forge"} />
            <CheckItem label={`${agentLabels[state.codingAgent]} installed`} ok={checkState === "done" && selectedAgentState.installed} />
            <CheckItem label={`${agentLabels[state.codingAgent]} authenticated`} ok={checkState === "done" && selectedAgentState.authenticated} />
          </div>
          <div className="detected-panel compact">
            <span className="detected-title"><Search size={14} /> Detected</span>
            <span className="muted" style={{ gridColumn: "1 / -1", fontSize: 11 }}>
              {checkState === "done"
                ? state.repositoryScenario === "existing_forge"
                  ? "Flow: Load existing Forge project"
                  : state.repositoryScenario === "new_forge"
                    ? "Flow: Setup new Forge project"
                    : "Flow blocked"
                : "No flow selected yet."}
            </span>
            <span className="muted" style={{ gridColumn: "1 / -1", fontSize: 11 }}>{checkState === "done" ? scenarioLabel : "No detection yet."}</span>
          </div>
        </div>
      </div>}
      {showDemoControls && <div className="setup-inline-actions compact-links centered-actions">
        <span className="muted">Demo detection:</span>
        <button className="setup-demo-link" onClick={() => runCheck("new_forge")}>New project flow</button>
        <button className="setup-demo-link" onClick={() => runCheck("existing_forge")}>Load existing Forge</button>
        <button className="setup-demo-link" onClick={() => runCheck("not_repo")}>Invalid repo</button>
      </div>}
      <button className="setup-button primary large" disabled={continueDisabled} onClick={onProceed}>
        {continueLabel} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="setup-page-header">
      <span className="setup-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}


function CodingAgentStep({
  state,
  setState,
  onGuidance,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  onGuidance: (agent: string) => void;
  footer: ReactNode;
}) {
  const descriptions: Record<CodingAgent, string> = {
    github_copilot: "GitHub-native coding agent for repository tasks.",
    claude_code: "Terminal-oriented agent for codebase implementation.",
    opencode: "Open-source coding agent with local execution.",
  };

  const profiles: Array<{
    value: ModelProfile;
    subtitle: string;
    description: string;
    tag?: string;
  }> = [
    {
      value: "stable",
      subtitle: "Default profile",
      description: "Reliable capability for day-to-day project workflows.",
      tag: "Recommended",
    },
    {
      value: "balanced",
      subtitle: "Balanced capability and usage",
      description: "A flexible profile for broader workflow experimentation.",
    },
    {
      value: "lite",
      subtitle: "Lower-cost experimentation",
      description: "Fast, lightweight behavior for early exploration.",
    },
  ];

  return (
    <>
      <StepHeader
        eyebrow="Step 2 of 5"
        title="Coding agent"
        description="Select an agent and profile. This is global readiness + project preference in one simulated step."
      />
      <div className="agent-grid">
        {(Object.keys(agentLabels) as CodingAgent[]).map((agent) => {
          const agentState = state.agentStates[agent];
          return (
            <button
              key={agent}
              className={`agent-card ${state.codingAgent === agent ? "selected" : ""}`}
              onClick={() => setState((current) => ({ ...current, codingAgent: agent }))}
            >
              <div className="agent-card-heading">
                <span><Bot size={20} /></span>
                {state.codingAgent === agent && <CheckCircle2 size={17} />}
              </div>
              <strong>{agentLabels[agent]}</strong>
              <p>{descriptions[agent]}</p>
              <div className="agent-statuses">
                <span className={agentState.installed ? "ok" : "warn"}>
                  {agentState.installed ? <Check size={12} /> : <AlertCircle size={12} />}
                  {agentState.installed ? "Installed" : "Not detected"}
                </span>
                <span className={agentState.authenticated ? "ok" : "warn"}>
                  {agentState.authenticated ? <Check size={12} /> : <AlertCircle size={12} />}
                  {agentState.authenticated ? "Authenticated" : "Authentication required"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {(!state.agentStates[state.codingAgent].installed ||
        !state.agentStates[state.codingAgent].authenticated) && (
        <div className="setup-warning-card">
          <TriangleAlert size={19} />
          <div>
            <strong>Agent setup needs attention</strong>
            <p>Authentication or installation must be completed before workflows can run.</p>
            <div className="setup-inline-actions">
              <button className="setup-link-button" onClick={() => onGuidance(state.codingAgent)}>
                <HelpCircle size={14} /> View setup guidance
              </button>
              <button
                className="setup-link-button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    agentStates: {
                      ...current.agentStates,
                      [current.codingAgent]: { installed: true, authenticated: true },
                    },
                  }))
                }
              >
                <RefreshCcw size={14} /> Mark ready
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="setup-step-gap" />
      <div className="setup-plain-section">
        <div className="setup-section-heading">
          <h2>Model profile</h2>
          <p>Choose how the coding agent balances quality, speed, and cost for workflow execution.</p>
        </div>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button
              key={profile.value}
              className={`profile-card ${state.modelProfile === profile.value ? "selected" : ""}`}
              onClick={() => setState((current) => ({ ...current, modelProfile: profile.value }))}
            >
              {state.modelProfile === profile.value ? (
                <CheckCircle2 className="profile-check" size={18} />
              ) : (
                <Circle className="profile-check muted-check" size={18} />
              )}
              <div>
                <span className="profile-title">
                  <strong>{modelLabels[profile.value]}</strong>
                  {profile.tag && <small>{profile.tag}</small>}
                </span>
                <b>{profile.subtitle}</b>
                <p>{profile.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {footer}
    </>
  );
}

function CodePlatformStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const select = (codePlatform: CodePlatform) =>
    setState((current) => ({
      ...current,
      codePlatform,
      codePlatformStatus: codePlatform === "github" ? "connected" : "not_checked",
    }));

  return (
    <>
      <StepHeader
        eyebrow="Step 3 of 6"
        title="Code platform"
        description="Choose the source platform. All connection states are simulated for demo control."
      />
      <div className="setup-choice-grid four">
        <ChoiceCard
          selected={state.codePlatform === "github"}
          icon={Github}
          title="GitHub"
          description="Connect a GitHub repository."
          onClick={() => select("github")}
        />
        <ChoiceCard
          selected={state.codePlatform === "bitbucket"}
          icon={Code2}
          title="Bitbucket"
          description="Connect a Bitbucket workspace."
          onClick={() => select("bitbucket")}
        />
        <ChoiceCard
          selected={state.codePlatform === "gitlab"}
          icon={Package}
          title="GitLab"
          description="Connect a GitLab project."
          onClick={() => select("gitlab")}
        />
        <ChoiceCard
          selected={state.codePlatform === "other"}
          icon={Cloud}
          title="Other"
          description="Continue without a direct connection."
          onClick={() => select("other")}
        />
      </div>
      <ConnectionPanel
        title={platformLabels[state.codePlatform]}
        icon={state.codePlatform === "github" ? Github : state.codePlatform === "other" ? Cloud : Code2}
        status={state.codePlatformStatus}
        connectedText={state.codePlatform === "github" ? "Connected as Stefan" : "Connection available"}
        details={
          state.codePlatform === "github"
            ? "progress-forge-control-center"
            : "Representative connection settings"
        }
        onStatus={(status) => setState((current) => ({ ...current, codePlatformStatus: status }))}
      />
      {footer}
    </>
  );
}

function IssueTrackerStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const options: Array<{ value: IssueTracker; icon: LucideIcon; description: string }> = [
    { value: "github_issues", icon: Github, description: "Use issues from the connected repository." },
    { value: "jira", icon: Settings2, description: "Connect a Jira site and project." },
    { value: "azure_devops", icon: Cloud, description: "Connect an Azure DevOps project." },
    { value: "other", icon: Package, description: "Explore another integration." },
  ];

  const select = (issueTracker: IssueTracker) =>
    setState((current) => ({
      ...current,
      issueTracker,
      issueTrackerStatus: issueTracker === "github_issues" ? "connected" : "not_checked",
    }));

  return (
    <>
      <StepHeader
        eyebrow="Step 3 of 5"
        title="Issue tracker"
        description="Pick tracker integration and simulate connection results."
      />
      <div className="setup-choice-grid four compact">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            selected={state.issueTracker === option.value}
            icon={option.icon}
            title={trackerLabels[option.value]}
            description={option.description}
            onClick={() => select(option.value)}
          />
        ))}
      </div>
      {state.issueTracker === "jira" ? (
        <div className="connection-detail-card">
          <div className="connection-detail-heading">
            <Settings2 size={19} />
            <div>
              <strong>Jira</strong>
              <p>Representative fields only. No external connection is made.</p>
            </div>
          </div>
          <div className="setup-form-grid">
            <label className="setup-field"><span>Site URL</span><input defaultValue="https://example.atlassian.net" /></label>
            <label className="setup-field"><span>Project key</span><input defaultValue="FORGE" /></label>
          </div>
          <ConnectionStatusLine status={state.issueTrackerStatus} connectedText="Connected to FORGE" />
          <StatusControls
            status={state.issueTrackerStatus}
            onStatus={(status) => setState((current) => ({ ...current, issueTrackerStatus: status }))}
          />
        </div>
      ) : (
        <ConnectionPanel
          title={trackerLabels[state.issueTracker]}
          icon={state.issueTracker === "github_issues" ? Github : Settings2}
          status={state.issueTrackerStatus}
          connectedText={state.issueTracker === "github_issues" ? "Issues available" : "Integration connected"}
          details={state.issueTracker === "github_issues" ? "progress-forge-control-center" : "Issue tracker connection"}
          onStatus={(status) => setState((current) => ({ ...current, issueTrackerStatus: status }))}
        />
      )}
      {footer}
    </>
  );
}

function ProjectDetailsStep({
  state,
  setState,
  footer,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  footer: ReactNode;
}) {
  const setMetadata = <K extends keyof ProjectMetadata>(key: K, value: ProjectMetadata[K]) =>
    setState((current) => ({ ...current, metadata: { ...current.metadata, [key]: value } }));

  return (
    <>
      <StepHeader
        eyebrow="Step 4 of 5"
        title="Project details"
        description="All fields are text inputs in this prototype to emphasize editable setup data."
      />
      <div className="suggestion-banner">
        <Search size={16} />
        <div>
          <strong>Suggested from repository</strong>
          <p>These values are simulated suggestions and remain fully editable.</p>
        </div>
      </div>
      <div className="metadata-form">
        <label className="setup-field">
          <span>Project name *</span>
          <input value={state.metadata.name} onChange={(event) => setMetadata("name", event.target.value)} />
          {!state.metadata.name.trim() && <small className="field-error">Project name is required.</small>}
        </label>
        <label className="setup-field full">
          <span>Description *</span>
          <textarea
            rows={3}
            value={state.metadata.description}
            onChange={(event) => setMetadata("description", event.target.value)}
          />
          {!state.metadata.description.trim() && <small className="field-error">Description is required.</small>}
        </label>
        <label className="setup-field">
          <span>Primary language *</span>
          <input value={state.metadata.language} onChange={(event) => setMetadata("language", event.target.value)} />
        </label>
        <label className="setup-field">
          <span>Frameworks *</span>
          <input
            value={state.metadata.frameworks.join(", ")}
            onChange={(event) =>
              setMetadata(
                "frameworks",
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
        <label className="setup-field">
          <span>Testing framework *</span>
          <input
            value={state.metadata.testingFramework}
            onChange={(event) => setMetadata("testingFramework", event.target.value)}
          />
        </label>
        <label className="setup-field">
          <span>Package manager *</span>
          <input
            value={state.metadata.packageManager}
            onChange={(event) => setMetadata("packageManager", event.target.value)}
          />
        </label>
      </div>
      {footer}
    </>
  );
}

function ReviewStep({
  state,
  setState,
  returnTo,
  onBack,
  onCancel,
  onValidated,
}: {
  state: SetupState;
  setState: React.Dispatch<React.SetStateAction<SetupState>>;
  returnTo?: string;
  onValidated: (project: Project) => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const navigate = useNavigate();
  const [validationIndex, setValidationIndex] = useState(0);
  const validationSteps = [
    "Validating project scenario",
    "Validating integrations",
    "Validating coding agent",
    "Validating project metadata",
  ];

  useEffect(() => {
    if (state.validationStatus !== "validating") return;
    let currentIndex = 0;
    setValidationIndex(0);

    const interval = window.setInterval(() => {
      if (currentIndex < validationSteps.length - 1) {
        currentIndex += 1;
        setValidationIndex(currentIndex);
        return;
      }

      window.clearInterval(interval);
      setState((current) => ({ ...current, validationStatus: "valid", validationMessage: undefined }));
      window.setTimeout(() => onValidated(toProject(state)), 350);
    }, 650);

    return () => window.clearInterval(interval);
  }, [onValidated, setState, state, state.validationStatus, validationSteps.length]);

  const edit = (path: string) => navigate(withReturn(`/setup/${path}`, returnTo));
  const rows = [
    {
      title: "Project",
      value: state.mode === "join" ? "Join existing project" : "Initialize project",
      detail: `${state.localPath} · ${state.repositoryScenario === "existing_forge" ? "existing Forge" : state.repositoryScenario === "new_forge" ? "new Forge" : "invalid"}`,
      path: "project",
    },
    {
      title: "Coding agent",
      value: `${agentLabels[state.codingAgent]} · ${modelLabels[state.modelProfile]}`,
      detail: state.agentStates[state.codingAgent].authenticated ? "Installed and authenticated" : "Setup required",
      path: "coding-agent",
    },
    {
      title: "Issue tracker",
      value: trackerLabels[state.issueTracker],
      detail: connectionLabel(state.issueTrackerStatus),
      path: "issue-tracker",
    },
    {
      title: "Project details",
      value: `${state.metadata.language} · ${state.metadata.frameworks.join(", ")}`,
      detail: `${state.metadata.testingFramework} · ${state.metadata.packageManager}`,
      path: "project-details",
    },
  ];

  return (
    <>
      <StepHeader
        eyebrow="Step 5 of 5"
        title="Review setup"
        description="Confirm all simulated decisions before adding the project to Forge."
      />
      <div className="review-layout">
        <div className="review-card">
          {rows.map((row) => (
            <div className="review-row" key={row.title}>
              <span className="review-row-icon"><ReviewIcon title={row.title} /></span>
              <div>
                <small>{row.title}</small>
                <strong>{row.value}</strong>
                <p>{row.detail}</p>
              </div>
              <button onClick={() => edit(row.path)}>Edit</button>
            </div>
          ))}
        </div>
        <aside className="config-preview-card">
          <FileCode2 size={20} />
          <h3>Conceptual configuration</h3>
          <p>Forge would represent this setup across project configuration files.</p>
          <code>.forge/config/agents.toml</code>
          <code>.forge/config/project.toml</code>
          <code>.forge/config/toolchain.toml</code>
        </aside>
      </div>
      {state.validationStatus === "invalid" && (
        <div className="validation-error">
          <XCircle size={20} />
          <div>
            <strong>Setup needs attention</strong>
            <p>{state.validationMessage}</p>
            <div className="setup-inline-actions">
              <button className="setup-link-button" onClick={() => edit("issue-tracker")}>Back to issue tracker</button>
              <button
                className="setup-link-button"
                onClick={() => {
                  setValidationIndex(0);
                  setState((current) => ({ ...current, validationStatus: "validating" }));
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
      {state.validationStatus === "validating" && (
        <div className="validation-progress">
          <LoaderCircle size={22} />
          <div>
            <div className="validation-progress-head">
              <strong>Validating project setup...</strong>
              <p>{validationSteps[validationIndex]}...</p>
            </div>
            <div className="validation-track full">
              <span style={{ width: `${((validationIndex + 1) / validationSteps.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}
      <div className="setup-review-footer">
        <div className="setup-footer-bar">
          <button className="setup-button ghost" onClick={onCancel}>Cancel</button>
          <div>
            <button className="setup-button secondary" onClick={onBack}>
              <ArrowLeft size={15} /> Back
            </button>
            <button
              className="setup-button primary"
              disabled={state.validationStatus === "validating"}
              onClick={() => {
                setValidationIndex(0);
                setState((current) => ({
                  ...current,
                  validationStatus: "validating",
                  validationMessage: undefined,
                }));
              }}
            >
              <ShieldCheck size={16} /> Validate and add project
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CompletePage({ project, onOpen, onReview }: { project: Project; onOpen: () => void; onReview: () => void }) {
  return (
    <div className="complete-card">
      <div className="complete-mark"><Check size={31} /></div>
      <span className="setup-eyebrow">Setup complete</span>
      <h1>Your project is ready</h1>
      <p><strong>{project.name}</strong> has been configured and is ready to open in Forge.</p>
      <div className="complete-checks">
        <CheckItem label="Repository configured" ok />
        <CheckItem label="Issue tracker configured" ok />
        <CheckItem label="Coding agent selected" ok />
        <CheckItem label="Project context complete" ok />
      </div>
      <button className="setup-button primary large" onClick={onOpen}>Open project <ArrowRight size={16} /></button>
      <button className="setup-link-button centered" onClick={onReview}>Review configuration</button>
    </div>
  );
}

function SetupSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="setup-section">
      <div className="setup-section-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ChoiceCard({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`setup-choice-card ${selected ? "selected" : ""}`} onClick={onClick}>
      <span className="setup-choice-icon"><Icon size={20} /></span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {selected ? <CheckCircle2 className="setup-choice-check" size={17} /> : <Circle className="setup-choice-check empty" size={17} />}
    </button>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`check-item ${ok ? "ok" : "warn"}`}>
      {ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {label}
    </span>
  );
}

function SetupFooter({
  onBack,
  onCancel,
  onContinue,
  continueLabel = "Continue",
  disabled,
  hideContinue = false,
}: {
  onBack?: () => void;
  onCancel: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  disabled?: boolean;
  hideContinue?: boolean;
}) {
  return (
    <div className="setup-footer">
        <div className="setup-footer-bar">
          <button className="setup-button ghost" onClick={onCancel}>Cancel</button>
          <div>
          {onBack && (
            <button className="setup-button secondary" onClick={onBack}>
              <ArrowLeft size={15} /> Back
            </button>
          )}
          {!hideContinue && (
            <button className="setup-button primary" onClick={onContinue} disabled={disabled}>
              {continueLabel} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionPanel({
  title,
  icon: Icon,
  status,
  connectedText,
  details,
  onStatus,
}: {
  title: string;
  icon: LucideIcon;
  status: ConnectionStatus;
  connectedText: string;
  details: string;
  onStatus: (status: ConnectionStatus) => void;
}) {
  return (
    <div className="setup-section connection-panel">
      <div className="connection-panel-header">
        <span className="connection-panel-icon"><Icon size={18} /></span>
        <div>
          <strong>{title}</strong>
          <p>{details}</p>
          </div>
      </div>
      <ConnectionStatusLine status={status} connectedText={connectedText} />
      <StatusControls status={status} onStatus={onStatus} />
    </div>
  );
}

function ConnectionStatusLine({ status, connectedText }: { status: ConnectionStatus; connectedText: string }) {
  const content: Record<ConnectionStatus, { icon: LucideIcon; text: string; tone: string }> = {
    not_checked: { icon: Circle, text: "Not connected", tone: "muted" },
    checking: { icon: LoaderCircle, text: "Checking connection...", tone: "blue" },
    connected: { icon: CheckCircle2, text: connectedText, tone: "green" },
    needs_authentication: { icon: AlertCircle, text: "Authentication required", tone: "amber" },
    failed: { icon: XCircle, text: "Connection failed", tone: "red" },
  };
  const item = content[status];
  const Icon = item.icon;
  return (
    <div className={`connection-status-line ${item.tone}`}>
      <Icon size={16} />
      <div>
        <strong>{item.text}</strong>
        <p>
          {status === "failed"
            ? "Check representative settings and try again."
            : status === "needs_authentication"
              ? "Complete authentication before workflows can run."
              : "Mock connection state for this prototype."}
        </p>
      </div>
    </div>
  );
}

function StatusControls({ status, onStatus }: { status: ConnectionStatus; onStatus: (status: ConnectionStatus) => void }) {
  const check = () => {
    onStatus("checking");
    window.setTimeout(() => onStatus("connected"), 650);
  };

  return (
    <div className="status-controls">
      <button className="setup-link-button" onClick={check}>
        <RefreshCcw size={14} /> {status === "connected" ? "Test connection" : "Check again"}
      </button>
      <span>Prototype states:</span>
      <button className="setup-demo-link" onClick={() => onStatus("needs_authentication")}>Authentication required</button>
      <button className="setup-demo-link" onClick={() => onStatus("failed")}>Failed</button>
    </div>
  );
}

function GuidanceDrawer({ topic, onClose }: { topic: string; onClose: () => void }) {
  const label = topic === "environment" ? "Environment prerequisite" : agentLabels[topic as CodingAgent] ?? "Coding agent";
  return (
    <>
      <div className="setup-drawer-scrim" onClick={onClose} />
      <aside className="setup-guidance-drawer">
        <div className="guidance-header">
          <div>
            <span className="setup-eyebrow">Static guidance</span>
            <h2>{label}</h2>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="guidance-body">
          <div className="guidance-icon"><HelpCircle size={24} /></div>
          <h3>Complete setup outside this prototype</h3>
          <p>
            This screen demonstrates where Forge would explain a missing prerequisite.
            It does not install software, run commands, or authenticate an account.
          </p>
          <ol>
            <li>Review the prerequisite documentation.</li>
            <li>Complete installation or authentication in the supported tool.</li>
            <li>Return to Forge and select <strong>Check again</strong>.</li>
          </ol>
          <a href="https://docs.github.com/en/copilot" target="_blank" rel="noreferrer">
            Open documentation <ExternalLink size={14} />
          </a>
        </div>
      </aside>
    </>
  );
}

function ReviewIcon({ title }: { title: string }) {
  const icons: Record<string, LucideIcon> = {
    Project: Folder,
    "Code platform": Github,
    "Issue tracker": FileText,
    "Coding agent": Bot,
    "Project details": Settings2,
  };
  const Icon = icons[title] ?? FileText;
  return <Icon size={17} />;
}

function connectionLabel(status: ConnectionStatus) {
  return status === "connected"
    ? "Connected"
    : status === "needs_authentication"
      ? "Authentication required"
      : status === "failed"
        ? "Connection failed"
        : "Not connected";
}

function metadataValid(metadata: ProjectMetadata) {
  return Boolean(
    metadata.name.trim() &&
      metadata.description.trim() &&
      metadata.language.trim() &&
      metadata.frameworks.length &&
      metadata.testingFramework.trim() &&
      metadata.packageManager.trim(),
  );
}

function toProject(state: SetupState): Project {
  const id =
    state.metadata.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `project-${Date.now()}`;
  const initials = state.metadata.name
    .split(/[\s-]+/)
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const repoBase = state.codePlatform === "bitbucket" ? "bitbucket.org" : state.codePlatform === "gitlab" ? "gitlab.com" : "github.com";

  return {
    id,
    name: state.metadata.name,
    shortName: initials || "NP",
    repository: `${repoBase}/progress/${state.metadata.name}`,
    description: state.metadata.description,
  };
}
