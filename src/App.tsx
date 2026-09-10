import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  Bell,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Circle,
  CirclePause,
  CirclePlay,
  Clock3,
  Cloud,
  Code2,
  FileCode2,
  FileText,
  GitPullRequest,
  GripVertical,
  HardDrive,
  Hammer,
  HelpCircle,
  Home,
  Inbox,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  UserRound,
  Users,
  WandSparkles,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  cancelCircleIcon,
  checkCircleIcon,
  fileIcon,
  gearIcon,
  pauseIcon,
  playIcon,
  type SVGIcon,
} from "@progress/kendo-svg-icons";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { usePrototype } from "./prototype";
import { SetupFlow } from "./setup";
import type { Artifact, Issue, Role, StepStatus, WorkflowRun, WorkflowStatus, WorkflowStep } from "./types";

const workflowCommandCatalog: Array<{ name: string; description: string }> = [
  { name: "Understand issue", description: "Analyze the issue, repository context, and constraints." },
  { name: "Create plan", description: "Produce an implementation plan and identify affected files." },
  { name: "Review plan", description: "Wait for human approval before implementation." },
  { name: "Implement", description: "Apply the planned changes with the selected coding agent." },
  { name: "Validate", description: "Run focused tests and check the implementation." },
  { name: "Review & create PR", description: "Review the result and prepare the pull request." },
  { name: "Summarize outcome", description: "Produce a concise summary of outcome and follow-up actions." },
  { name: "Prepare release note", description: "Draft a release-ready change note for project stakeholders." },
];

function KendoIcon({ icon, className }: { icon: SVGIcon; className?: string }) {
  return (
    <span className={`k-svg-icon k-icon-md ${className ?? ""}`} aria-hidden="true">
      <svg viewBox={icon.viewBox || "0 0 16 16"} dangerouslySetInnerHTML={{ __html: icon.content }} />
    </span>
  );
}

const workflowStatusMeta: Record<
  WorkflowStatus,
  { label: string; icon: LucideIcon; tone: string }
> = {
  running: { label: "Running", icon: LoaderCircle, tone: "blue" },
  paused: { label: "Paused", icon: CirclePause, tone: "gray" },
  waiting: { label: "Needs input", icon: AlertCircle, tone: "amber" },
  failed: { label: "Failed", icon: XCircle, tone: "red" },
  completed: { label: "Completed", icon: CheckCircle2, tone: "green" },
  cancelled: { label: "Cancelled", icon: Square, tone: "gray" },
};

const stepStatusMeta: Record<
  StepStatus,
  { label: string; icon: LucideIcon; tone: string }
> = {
  running: { label: "Running", icon: LoaderCircle, tone: "blue" },
  paused: { label: "Paused", icon: Pause, tone: "gray" },
  waiting: { label: "Needs input", icon: AlertCircle, tone: "amber" },
  failed: { label: "Failed", icon: X, tone: "red" },
  completed: { label: "Completed", icon: Check, tone: "green" },
  pending: { label: "Pending", icon: Circle, tone: "muted" },
  cancelled: { label: "Cancelled", icon: Square, tone: "gray" },
};

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const meta = workflowStatusMeta[status];
  const Icon = meta.icon;
  return (
    <span className={`status-badge ${meta.tone}`}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function ProgressBar({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={`progress-track ${compact ? "compact" : ""}`} aria-label={`${value}% complete`}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function getIssue(workflow: WorkflowRun, allIssues: Issue[]) {
  return allIssues.find(
    (issue) => issue.id === workflow.issueId && issue.projectId === workflow.projectId,
  );
}

function currentStep(workflow: WorkflowRun) {
  const current =
    workflow.steps.find((item) => ["running", "waiting", "failed", "paused"].includes(item.status)) ??
    workflow.steps[workflow.steps.length - 1];
  return {
    step: current,
    number: workflow.steps.findIndex((item) => item.id === current.id) + 1,
  };
}

function AppShell() {
  const { projectId } = useParams();
  const { projects, workflows, issues, role, setRole, resetDemo } = usePrototype();
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const location = useLocation();
  const waitingCount = workflows.filter((workflow) => workflow.status === "waiting").length;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <div className="app-shell">
      <button
        className="mobile-menu"
        aria-label="Toggle navigation"
        onClick={() => setSidebarOpen((value) => !value)}
      >
        <Menu size={20} />
      </button>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Hammer size={16} /></div>
          <div>
            <strong>forge</strong>
            <span>Control Center</span>
          </div>
        </div>
        <div className="sidebar-label">Projects</div>
        <nav className="project-list" aria-label="Projects">
          {projects.map((item) => {
            const activeCount = workflows.filter(
              (workflow) =>
                workflow.projectId === item.id &&
                ["running", "waiting", "paused"].includes(workflow.status),
            ).length;
            return (
              <Link
                key={item.id}
                to={`/projects/${item.id}`}
                className={item.id === project.id ? "project-link active" : "project-link"}
              >
                <span className="project-avatar">{item.shortName}</span>
                <span className="project-link-copy">
                  <strong>{item.name}</strong>
                  <span>{activeCount ? `${activeCount} active` : "No active runs"}</span>
                </span>
                {activeCount > 0 && <span className="active-dot" />}
              </Link>
            );
          })}
        </nav>
        <Link className="sidebar-action" to={`/setup/project?returnTo=${project.id}`}>
          <Plus size={16} />
          Add project
        </Link>
        <div className="sidebar-spacer" />
        <div className="role-panel">
          <span className="sidebar-label">Prototype role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="read-only">Read-only</option>
            <option value="active">Active</option>
            <option value="admin">Admin</option>
          </select>
          <button className="reset-button" onClick={resetDemo}>
            <RotateCcw size={14} />
            Reset demo
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <span className="eyebrow">{project.repository}</span>
            <strong>{project.name}</strong>
          </div>
          <div className="topbar-actions">
            <span className="engine-status">
              <span className="connection-dot" />
              Local engine
            </span>
            <button className="icon-button notification" aria-label="Notifications">
              <Bell size={18} />
              {waitingCount > 0 && <span>{waitingCount}</span>}
            </button>
            <div className="user-chip">
              <span className="user-avatar">SS</span>
              <span>
                <strong>Stefan</strong>
                <small>{role === "read-only" ? "Observer" : role === "admin" ? "Admin" : "Active"}</small>
              </span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>
        <nav className="project-tabs" aria-label="Project">
          <NavLink end to={`/projects/${project.id}`}>
            Overview
          </NavLink>
          <NavLink to={`/projects/${project.id}/issues`}>Issues</NavLink>
          <NavLink to={`/projects/${project.id}/workflows`}>Workflows</NavLink>
          <NavLink to={`/projects/${project.id}/settings`}>Configuration</NavLink>
        </nav>
        <main className="page">
          <Routes>
            <Route index element={<ProjectOverview />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="issues/:issueId" element={<IssueDetailPage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="workflows/:workflowId" element={<WorkflowDetailPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Routes>
        </main>
      </div>
      <ArtifactDrawer />
    </div>
  );
}

export function App() {
  const { projects } = usePrototype();
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={projects.length ? `/projects/${projects[0].id}` : "/setup/welcome"}
            replace
          />
        }
      />
      <Route path="/setup/*" element={<SetupFlow />} />
      <Route
        path="/projects/:projectId/*"
        element={projects.length ? <AppShell /> : <Navigate to="/setup/welcome" replace />}
      />
      <Route
        path="*"
        element={
          <Navigate
            to={projects.length ? `/projects/${projects[0].id}` : "/setup/welcome"}
            replace
          />
        }
      />
    </Routes>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function ProjectOverview() {
  const { projectId } = useParams();
  const { projects, workflows, issues } = usePrototype();
  const project = projects.find((item) => item.id === projectId)!;
  const projectWorkflows = workflows.filter((workflow) => workflow.projectId === projectId);
  const active = projectWorkflows.filter((workflow) =>
    ["running", "waiting", "paused"].includes(workflow.status),
  );
  const recent = projectWorkflows.filter((workflow) =>
    ["completed", "failed", "cancelled"].includes(workflow.status),
  );
  const waiting = active.filter((workflow) => workflow.status === "waiting").length;

  return (
    <>
      <PageHeader
        eyebrow="Project overview"
        title={`Good morning, Stefan`}
        description={`Here’s what Forge is doing in ${project.name}.`}
      />
      <div className="metric-grid">
        <Metric icon={Activity} label="Active workflows" value={String(active.length)} detail="Across local and cloud" />
        <Metric icon={AlertCircle} label="Needs attention" value={String(waiting)} detail="Waiting for your input" tone="amber" />
        <Metric icon={CheckCircle2} label="Completed this week" value={String(recent.filter((item) => item.status === "completed").length)} detail="Successful workflow runs" tone="green" />
        <Metric icon={Clock3} label="Local engine" value="Online" detail="Connected 2 minutes ago" tone="green" />
      </div>
      <section className="section">
        <SectionHeader
          title="Active workflows"
          description="Work currently running or waiting for input."
          action={<Link to={`/projects/${projectId}/workflows`}>View all <ChevronRight size={14} /></Link>}
        />
        {active.length ? (
          <div className="workflow-card-grid">
            {active.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} issue={getIssue(workflow, issues)} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No workflows are running"
            description="Select an issue to start a Forge workflow."
            action={<Link className="button primary" to={`/projects/${projectId}/issues`}>Browse issues</Link>}
          />
        )}
      </section>
      <section className="section">
        <SectionHeader title="Recent workflows" description="Recently completed and interrupted activity." />
        <div className="panel workflow-list">
          {recent.length ? (
            recent.map((workflow) => (
              <WorkflowRow key={workflow.id} workflow={workflow} issue={getIssue(workflow, issues)} />
            ))
          ) : (
            <div className="empty-row">No recent workflow activity.</div>
          )}
        </div>
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${tone}`}><Icon size={19} /></span>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {action}
    </div>
  );
}

function WorkflowCard({ workflow, issue }: { workflow: WorkflowRun; issue?: Issue }) {
  const current = currentStep(workflow);
  const progress =
    current.step.progress ??
    Math.round((workflow.steps.filter((item) => item.status === "completed").length / workflow.steps.length) * 100);
  return (
    <Link to={`/projects/${workflow.projectId}/workflows/${workflow.id}`} className="workflow-card">
      <div className="workflow-card-top">
        <div>
          <span className="workflow-type"><GitPullRequest size={15} /> {workflow.workflowName}</span>
          <h3>#{issue?.id} · {issue?.title}</h3>
        </div>
        <StatusBadge status={workflow.status} />
      </div>
      <div className="workflow-current">
        <div>
          <span>Current step</span>
          <strong>{current.number}. {current.step.name}</strong>
        </div>
        <strong>{progress}%</strong>
      </div>
      <ProgressBar value={progress} />
      <div className="workflow-meta">
        <span><UserRound size={14} /> {workflow.startedBy}</span>
        <span>{workflow.execution === "local" ? <HardDrive size={14} /> : <Cloud size={14} />} {workflow.execution === "local" ? "Local" : "Cloud Agent"}</span>
        <span><Clock3 size={14} /> {workflow.startedAt}</span>
      </div>
    </Link>
  );
}

function WorkflowRow({ workflow, issue }: { workflow: WorkflowRun; issue?: Issue }) {
  const current = currentStep(workflow);
  return (
    <Link to={`/projects/${workflow.projectId}/workflows/${workflow.id}`} className="workflow-row">
      <span className="row-icon"><GitPullRequest size={17} /></span>
      <span className="row-main"><strong>{workflow.workflowName}</strong><small>#{issue?.id} · {issue?.title}</small></span>
      <span className="row-person">{workflow.startedBy}</span>
      <StatusBadge status={workflow.status} />
      <span className="row-step">{current.number}/{workflow.steps.length} · {current.step.name}</span>
      <ChevronRight size={17} />
    </Link>
  );
}

function IssuesPage() {
  const { projectId } = useParams();
  const { issues, workflows } = usePrototype();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const projectIssues = issues.filter(
    (issue) =>
      issue.projectId === projectId &&
      (filter === "all" || issue.status === filter) &&
      `${issue.id} ${issue.title}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Issues" description="Browse project work and start a Forge workflow." />
      <div className="toolbar">
        <label className="search-field">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues…" />
        </label>
        <div className="segmented">
          {(["all", "open", "closed"] as const).map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Issue</th><th>Status</th><th>Assignee</th><th>Forge activity</th><th /></tr></thead>
          <tbody>
            {projectIssues.map((issue) => {
              const issueWorkflows = workflows.filter((workflow) => workflow.issueId === issue.id);
              const latest = issueWorkflows[0];
              return (
                <tr key={issue.id}>
                  <td><Link className="issue-cell" to={`/projects/${projectId}/issues/${issue.id}`}><span>#{issue.id}</span><strong>{issue.title}</strong><small>{issue.labels.join(" · ")}</small></Link></td>
                  <td><span className={`issue-status ${issue.status}`}>{issue.status}</span></td>
                  <td><span className="assignee"><span>{issue.assignee?.slice(0, 1)}</span>{issue.assignee ?? "Unassigned"}</span></td>
                  <td>{latest ? <StatusBadge status={latest.status} /> : <span className="muted">No activity</span>}</td>
                  <td><ChevronRight size={17} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!projectIssues.length && <div className="empty-row">No issues match this view.</div>}
      </div>
    </>
  );
}

function IssueDetailPage() {
  const { projectId, issueId } = useParams();
  const navigate = useNavigate();
  const { issues, workflows, role } = usePrototype();
  const issue = issues.find((item) => item.id === issueId && item.projectId === projectId);
  const previousRuns = workflows.filter((workflow) => workflow.issueId === issueId);
  const [startOpen, setStartOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  if (!issue) return <Navigate to={`/projects/${projectId}/issues`} replace />;

  return (
    <>
      <button className="back-link" onClick={() => navigate(`/projects/${projectId}/issues`)}>
        <ArrowLeft size={15} /> Issues
      </button>
      <div className="issue-hero">
        <div className="issue-number">#{issue.id}</div>
        <div className="issue-title-row">
          <div><h1>{issue.title}</h1><div className="issue-byline"><span className={`issue-status ${issue.status}`}>{issue.status}</span><span>assigned to <strong>{issue.assignee}</strong></span></div></div>
          <MoreHorizontal size={20} />
        </div>
        <p>{issue.description}</p>
        <div className="label-row">{issue.labels.map((label) => <span key={label}>{label}</span>)}</div>
      </div>
      <section className="forge-panel">
        <div className="forge-panel-header">
          <div className="forge-heading"><span className="brand-mark small"><Hammer size={14} /></span><div><h2>Forge</h2><p>Run controlled work for this issue.</p></div></div>
          <div className="page-actions">
            <button className="button primary" disabled={role === "read-only"} onClick={() => setStartOpen(true)}>
              <Play size={15} /> Run workflow
            </button>
            <button className="button secondary" disabled={role === "read-only"} onClick={() => setCommandOpen(true)}>
              <WandSparkles size={15} /> Run command <ChevronDown size={14} />
            </button>
            <span className="concept-label">Concept</span>
          </div>
        </div>
        {role === "read-only" && <div className="permission-note"><ShieldCheck size={15} /> Read-only role can review existing work but cannot start new runs.</div>}
      </section>
      <section className="section">
        <SectionHeader title="Previous runs" description="Workflow and command activity for this issue." />
        <div className="panel workflow-list">
          {previousRuns.length ? previousRuns.map((workflow) => <WorkflowRow key={workflow.id} workflow={workflow} issue={issue} />) : (
            <EmptyState icon={Archive} title="No Forge runs for this issue yet" description="Start a workflow to analyze and implement this issue." action={role !== "read-only" ? <button className="button primary" onClick={() => setStartOpen(true)}>Run workflow</button> : undefined} />
          )}
        </div>
      </section>
      {startOpen && <StartWorkflowDialog issue={issue} onClose={() => setStartOpen(false)} />}
      {commandOpen && <RunCommandDialog issue={issue} onClose={() => setCommandOpen(false)} />}
    </>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header"><div><h2>{title}</h2>{subtitle}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

function StartWorkflowDialog({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const { startWorkflow } = usePrototype();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<"local" | "cloud">("local");
  const [agent, setAgent] = useState("GitHub Copilot");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const workflowId = startWorkflow(issue.projectId, issue.id, execution, agent);
    onClose();
    navigate(`/projects/${issue.projectId}/workflows/${workflowId}`);
  };
  return (
    <Modal title="Start workflow" subtitle={<p className="modal-subtitle">#{issue.id} · {issue.title}</p>} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body">
          <label className="field"><span>Workflow</span><select><option>Issue → Pull Request</option></select></label>
          <fieldset className="field"><legend>Execution</legend><div className="choice-grid">
            <button type="button" className={`choice-card ${execution === "local" ? "selected" : ""}`} onClick={() => setExecution("local")}><HardDrive size={20} /><span><strong>Local</strong><small>Run with the local Forge engine</small></span>{execution === "local" && <CheckCircle2 size={17} />}</button>
            <button type="button" className={`choice-card ${execution === "cloud" ? "selected" : ""}`} onClick={() => setExecution("cloud")}><Cloud size={20} /><span><strong>Cloud Agent</strong><small>Run in an isolated cloud environment</small></span>{execution === "cloud" && <CheckCircle2 size={17} />}</button>
          </div></fieldset>
          <label className="field"><span>Coding agent</span><select value={agent} onChange={(event) => setAgent(event.target.value)}><option>GitHub Copilot</option><option>Forge Coding Agent</option></select></label>
          <div className="run-summary"><Sparkles size={17} /><span>Forge will analyze the issue, create a plan, wait for approval, implement, validate, and prepare a pull request.</span></div>
        </div>
        <div className="modal-footer"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary"><Play size={15} /> Start workflow</button></div>
      </form>
    </Modal>
  );
}

type CommandStage = "picker" | "form" | "running" | "completed";

function RunCommandDialog({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const { openArtifact } = usePrototype();
  const [stage, setStage] = useState<CommandStage>("picker");
  const [command, setCommand] = useState<"ask" | "draft" | "review">("ask");
  const [question, setQuestion] = useState("What parts of authentication need to change?");
  const [progress, setProgress] = useState(12);
  const resultArtifact = useMemo<Artifact>(() => ({
    id: `command-${issue.id}`,
    name: command === "ask" ? "forge-response.md" : command === "draft" ? "issue-draft.md" : "review-summary.md",
    type: "markdown",
    versions: [{
      version: 1,
      label: "Current",
      createdAt: "Just now",
      content: command === "ask"
        ? `# Forge response\n\n## Question\n\n${question}\n\n## Answer\n\nOAuth affects provider configuration, callback routing, authentication middleware, and session creation. The safest implementation keeps provider-specific behavior behind an adapter and preserves the current token path.\n\n## Recommended focus\n\n1. Validate callback state\n2. Normalize provider errors\n3. Add focused middleware tests`
        : command === "draft"
          ? `# Issue draft\n\n## Summary\n\nAdd configurable OAuth authentication while preserving local token behavior.\n\n## Acceptance criteria\n\n- Provider settings are validated\n- Callback failures are actionable\n- Existing token authentication is unchanged\n- Focused tests cover success and failure`
          : `# Issue review\n\n## Findings\n\nThe issue is implementation-ready. The main risk is coupling provider logic directly to middleware.\n\n## Recommendation\n\nUse a provider adapter and require callback-state validation.`,
    }],
  }), [command, issue.id, question]);

  useEffect(() => {
    if (stage !== "running") return;
    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          window.clearInterval(interval);
          setStage("completed");
          return 100;
        }
        return Math.min(value + 18, 100);
      });
    }, 450);
    return () => window.clearInterval(interval);
  }, [stage]);

  const choose = (value: typeof command) => {
    setCommand(value);
    setStage("form");
  };
  const title = stage === "picker" ? "Run Forge command" : command === "ask" ? "Ask Forge" : command === "draft" ? "Issue draft" : "Review issue";
  return (
    <Modal title={title} subtitle={<span className="concept-label">Concept · Future exploration</span>} onClose={onClose} wide>
      <div className="modal-body">
        {stage === "picker" && <div className="command-grid">
          <CommandCard icon={HelpCircle} title="Ask Forge" description="Ask a focused question about this issue." onClick={() => choose("ask")} />
          <CommandCard icon={FileCode2} title="Issue draft" description="Generate a structured issue draft." onClick={() => choose("draft")} />
          <CommandCard icon={Search} title="Review" description="Review readiness, scope, and risks." onClick={() => choose("review")} />
        </div>}
        {stage === "form" && <div className="command-form">
          <div className="command-issue"><span>Issue</span><strong>#{issue.id} · {issue.title}</strong></div>
          {command === "ask" && <label className="field"><span>Question</span><textarea rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} /></label>}
          {command !== "ask" && <div className="run-summary"><Sparkles size={17} /><span>Forge will use the issue context to generate a mock {command === "draft" ? "issue draft" : "readiness review"}.</span></div>}
        </div>}
        {stage === "running" && <div className="command-running"><span className="large-status blue"><LoaderCircle size={22} /> Running</span><h3>Analyzing issue context…</h3><p>Forge is preparing the command output and artifact.</p><ProgressBar value={progress} /><small>{progress}% complete</small></div>}
        {stage === "completed" && <div className="command-complete"><span className="large-status green"><CheckCircle2 size={22} /> Completed</span><h3>Command artifact is ready</h3><p>Review the generated Markdown without leaving this issue.</p><button className="artifact-row" onClick={() => openArtifact(resultArtifact)}><span className="artifact-icon"><FileText size={18} /></span><span><strong>{resultArtifact.name}</strong><small>Markdown · Created just now</small></span><span>View</span><ChevronRight size={16} /></button></div>}
      </div>
      <div className="modal-footer">
        {stage === "picker" && <button className="button ghost" onClick={onClose}>Cancel</button>}
        {stage === "form" && <><button className="button ghost" onClick={() => setStage("picker")}>Back</button><button className="button primary" onClick={() => { setProgress(12); setStage("running"); }}><Play size={15} /> Run command</button></>}
        {stage === "completed" && <button className="button primary" onClick={onClose}>Done</button>}
      </div>
    </Modal>
  );
}

function CommandCard({ icon: Icon, title, description, onClick }: { icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return <button className="command-card" onClick={onClick}><span><Icon size={21} /></span><div><strong>{title}</strong><p>{description}</p></div><ChevronRight size={18} /></button>;
}

function WorkflowsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { workflows, issues } = usePrototype();
  const [filter, setFilter] = useState<"all" | WorkflowStatus>("all");
  const projectWorkflows = workflows.filter(
    (workflow) => workflow.projectId === projectId && (filter === "all" || workflow.status === filter),
  );
  const filters: Array<{ value: "all" | WorkflowStatus; label: string }> = [
    { value: "all", label: "All" }, { value: "running", label: "Running" },
    { value: "waiting", label: "Needs input" }, { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" }, { value: "failed", label: "Failed" },
  ];
  return (
    <>
      <PageHeader title="Workflows" description="Monitor every Forge workflow running in this project." />
      <div className="toolbar">
        <div className="segmented workflow-filters">{filters.map((item) => <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
        <button className="button secondary"><ListFilter size={15} /> More filters</button>
      </div>
      <div className="panel table-wrap">
        <table className="workflow-table">
          <thead><tr><th>Workflow</th><th>Issue</th><th>Started by</th><th>Status</th><th>Current step</th><th>Execution</th><th /></tr></thead>
          <tbody>{projectWorkflows.map((workflow) => {
            const issue = getIssue(workflow, issues);
            const current = currentStep(workflow);
            const progress = current.step.progress;
            return <tr key={workflow.id} onClick={() => navigate(`/projects/${projectId}/workflows/${workflow.id}`)}>
              <td><span className="table-workflow"><span className="row-icon"><GitPullRequest size={16} /></span><span><strong>{workflow.workflowName}</strong><small>{workflow.startedAt}</small></span></span></td>
              <td><strong>#{issue?.id}</strong><br /><span className="muted">{issue?.title}</span></td>
              <td><span className="assignee"><span>{workflow.startedBy[0]}</span>{workflow.startedBy}</span></td>
              <td><StatusBadge status={workflow.status} /></td>
              <td><div className="step-cell"><span>{current.number}/{workflow.steps.length} · {current.step.name}</span>{progress !== undefined && <ProgressBar value={progress} compact />}</div></td>
              <td><span className="execution-cell">{workflow.execution === "local" ? <HardDrive size={15} /> : <Cloud size={15} />}{workflow.execution === "local" ? "Local" : "Cloud"}</span></td>
              <td><ChevronRight size={17} /></td>
            </tr>;
          })}</tbody>
        </table>
        {!projectWorkflows.length && <EmptyState icon={Inbox} title="No workflows in this view" description="Choose another status filter to see project activity." />}
      </div>
    </>
  );
}

function WorkflowDetailPage() {
  const { projectId, workflowId } = useParams();
  const navigate = useNavigate();
  const { workflows, issues, role, pauseWorkflow, resumeWorkflow, cancelWorkflow, setWorkflowSteps } = usePrototype();
  const [editOpen, setEditOpen] = useState(false);
  const workflow = workflows.find((item) => item.id === workflowId);
  if (!workflow) return <Navigate to={`/projects/${projectId}/workflows`} replace />;
  const issue = getIssue(workflow, issues);
  const current = currentStep(workflow);
  return (
    <>
      <button className="back-link" onClick={() => navigate(`/projects/${projectId}/workflows`)}><ArrowLeft size={15} /> Workflows</button>
      <div className="workflow-hero">
        <div className="workflow-hero-main">
          <div className="workflow-hero-icon"><GitPullRequest size={21} /></div>
          <div><span className="eyebrow">Workflow run</span><h1>{workflow.workflowName}</h1><Link to={`/projects/${projectId}/issues/${issue?.id}`}>#{issue?.id} · {issue?.title}</Link></div>
        </div>
        <div className="page-actions">
          <button className="button secondary" disabled={role === "read-only"} onClick={() => setEditOpen(true)}><KendoIcon icon={gearIcon} className="kendo-inline-icon" /> Edit steps</button>
          {workflow.status === "running" && <button className="button secondary" disabled={role === "read-only"} onClick={() => pauseWorkflow(workflow.id)}><Pause size={15} /> Pause</button>}
          {workflow.status === "paused" && <button className="button primary" disabled={role === "read-only"} onClick={() => resumeWorkflow(workflow.id)}><Play size={15} /> Resume</button>}
          {!["completed", "cancelled"].includes(workflow.status) && <button className="button danger-subtle" disabled={role === "read-only"} onClick={() => cancelWorkflow(workflow.id)}><Square size={14} /> Cancel</button>}
          <button className="icon-button"><MoreHorizontal size={19} /></button>
        </div>
      </div>
      <div className="workflow-facts">
        <div><span>Status</span><StatusBadge status={workflow.status} /></div>
        <div><span>Current step</span><strong>{current.number} of {workflow.steps.length} · {current.step.name}</strong></div>
        <div><span>Execution</span><strong>{workflow.execution === "local" ? <HardDrive size={15} /> : <Cloud size={15} />}{workflow.execution === "local" ? "Local" : "Cloud Agent"}</strong></div>
        <div><span>Started by</span><strong><span className="mini-avatar">{workflow.startedBy[0]}</span>{workflow.startedBy}</strong></div>
        <div><span>Started</span><strong>{workflow.startedAt}</strong></div>
      </div>
      {role === "read-only" && <div className="permission-note standalone"><ShieldCheck size={15} /> You’re viewing this workflow as a read-only observer. Artifacts and status remain available.</div>}
      <section className="timeline-section">
        <div className="timeline-heading"><div><h2>Workflow timeline</h2><p>Follow progress, decisions, and outputs for each stage.</p></div><span>{workflow.steps.filter((item) => item.status === "completed").length} of {workflow.steps.length} complete</span></div>
        <div className="timeline">{workflow.steps.map((step, index) => <WorkflowStepCard key={step.id} workflow={workflow} step={step} index={index} />)}</div>
      </section>
      {editOpen && <WorkflowEditDialog workflow={workflow} onClose={() => setEditOpen(false)} onSave={(steps) => { setWorkflowSteps(workflow.id, steps); setEditOpen(false); }} />}
    </>
  );
}

function WorkflowEditDialog({
  workflow,
  onClose,
  onSave,
}: {
  workflow: WorkflowRun;
  onClose: () => void;
  onSave: (steps: WorkflowStep[]) => void;
}) {
  const [steps, setSteps] = useState<WorkflowStep[]>(() => structuredClone(workflow.steps));
  const [newCommand, setNewCommand] = useState<string>(workflowCommandCatalog[0].name);
  const [showCustomSoon, setShowCustomSoon] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setSteps(next);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) return;
    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveByDrag = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= steps.length || to >= steps.length) return;
    const next = [...steps];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSteps(next);
  };

  const addStep = () => {
    if (newCommand === "custom") {
      setShowCustomSoon(true);
      return;
    }
    const catalog = workflowCommandCatalog.find((item) => item.name === newCommand);
    if (!catalog) return;
    const idBase = catalog.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setSteps((current) => [
      ...current,
      {
        id: `${idBase}-${Date.now()}`,
        name: catalog.name,
        description: catalog.description,
        status: "pending",
        artifacts: [],
      },
    ]);
  };

  const save = () => {
    const normalized = steps.map((step, index) => ({
      ...step,
      status: index === 0 && workflow.status === "running" ? "running" : step.status,
      progress: index === 0 && workflow.status === "running" ? Math.max(step.progress ?? 5, 5) : step.progress,
    }));
    onSave(normalized);
  };

  return (
    <Modal title="Edit workflow steps" subtitle={<p className="modal-subtitle">Reorder, remove, or add simulated commands.</p>} onClose={onClose} wide>
      <div className="modal-body">
        <div className="command-grid">
          {steps.map((step, index) => (
            <div
              key={`${step.id}-${index}`}
              className={`workflow-edit-row ${dragIndex === index ? "dragging" : ""}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex === null) return;
                moveByDrag(dragIndex, index);
                setDragIndex(null);
              }}
            >
              <div>
                <strong>{index + 1}. {step.name}</strong>
                <p>{step.description}</p>
              </div>
              <div className="workflow-edit-actions">
                <button className="icon-button drag-handle" aria-label="Drag step" title="Drag step">
                  <GripVertical size={16} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  aria-label="Move step up"
                  title="Move step up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === steps.length - 1}
                  aria-label="Move step down"
                  title="Move step down"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  className="icon-button danger-icon"
                  onClick={() => removeStep(index)}
                  disabled={steps.length === 1}
                  aria-label="Remove step"
                  title="Remove step"
                >
                  <KendoIcon icon={cancelCircleIcon} className="kendo-inline-icon" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="workflow-edit-add">
          <label className="field">
            <span>Add command</span>
            <select value={newCommand} onChange={(event) => { setNewCommand(event.target.value); setShowCustomSoon(false); }}>
              {workflowCommandCatalog.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              <option value="custom">Custom step (Coming soon)</option>
            </select>
          </label>
          <button className="button secondary" onClick={addStep}><KendoIcon icon={playIcon} className="kendo-inline-icon" /> Add step</button>
        </div>
        {showCustomSoon && <div className="prototype-notice"><WandSparkles size={16} /><span>Custom step is coming soon in this prototype.</span></div>}
      </div>
      <div className="modal-footer">
        <button className="button ghost" onClick={onClose}>Cancel</button>
        <button className="button primary" onClick={save}><KendoIcon icon={checkCircleIcon} className="kendo-inline-icon" /> Save step order</button>
      </div>
    </Modal>
  );
}

function WorkflowStepCard({ workflow, step, index }: { workflow: WorkflowRun; step: WorkflowRun["steps"][number]; index: number }) {
  const { role, openArtifact, pauseWorkflow, cancelWorkflow, resumeWorkflow, retryStep, restartStep, approveStep, rejectStep, requestChanges } = usePrototype();
  const [expanded, setExpanded] = useState(step.status !== "pending");
  const [changesOpen, setChangesOpen] = useState(false);
  const [feedback, setFeedback] = useState("Clarify how existing token authentication remains unaffected.");
  const meta = stepStatusMeta[step.status];
  const Icon = meta.icon;
  const mutatingDisabled = role === "read-only";
  return (
    <div className={`timeline-item ${step.status}`}>
      <div className={`timeline-node ${meta.tone}`}><Icon size={17} /></div>
      {index < workflow.steps.length - 1 && <div className="timeline-line" />}
      <div className={`step-card ${expanded ? "expanded" : ""}`}>
        <button className="step-summary" onClick={() => setExpanded((value) => !value)}>
          <div className="step-number">{index + 1}</div>
          <div className="step-title"><strong>{step.name}</strong><span>{step.description}</span></div>
          <div className={`step-status ${meta.tone}`}><Icon size={14} /> {meta.label}{step.duration && ` · ${step.duration}`}</div>
          <ChevronDown size={18} className={expanded ? "rotate" : ""} />
        </button>
        {expanded && <div className="step-body">
          {step.status === "running" && <div className="active-step-content">
            <div className="activity-label"><span>Current activity</span><strong>{step.activity}</strong></div>
            <div className="progress-line"><ProgressBar value={step.progress ?? 0} /><strong>{step.progress ?? 0}%</strong></div>
            <div className="inline-actions"><button className="button secondary small" disabled={mutatingDisabled} onClick={() => pauseWorkflow(workflow.id)}><Pause size={14} /> Pause workflow</button><button className="button ghost small danger-text" disabled={mutatingDisabled} onClick={() => cancelWorkflow(workflow.id)}>Cancel workflow</button></div>
          </div>}
          {step.status === "paused" && <div className="state-callout gray"><CirclePause size={21} /><div><strong>Workflow paused</strong><p>{step.activity ?? "This step was paused by a user."}</p><div className="inline-actions"><button className="button primary small" disabled={mutatingDisabled} onClick={() => resumeWorkflow(workflow.id)}><Play size={14} /> Resume</button><button className="button secondary small" disabled={mutatingDisabled} onClick={() => restartStep(workflow.id, step.id)}><RefreshCcw size={14} /> Restart step</button><button className="button ghost small danger-text" disabled={mutatingDisabled} onClick={() => cancelWorkflow(workflow.id)}>Cancel</button></div></div></div>}
          {step.status === "failed" && <div className="state-callout red"><XCircle size={21} /><div><strong>Validation failed</strong><p>{step.message}</p><button className="details-link">View failure details <ChevronRight size={14} /></button><div className="inline-actions"><button className="button primary small" disabled={mutatingDisabled} onClick={() => retryStep(workflow.id, step.id)}><RefreshCcw size={14} /> Retry step</button><button className="button ghost small danger-text" disabled={mutatingDisabled} onClick={() => cancelWorkflow(workflow.id)}>Cancel workflow</button></div></div></div>}
          {step.status === "waiting" && <div className="approval-card">
            <div className="approval-heading"><span className="approval-icon"><AlertCircle size={20} /></span><div><strong>Waiting for your approval</strong><p>Forge created an implementation plan and needs a decision before continuing.</p></div></div>
            {!!step.artifacts.length && <ArtifactList artifacts={step.artifacts} onOpen={openArtifact} />}
            <div className="approval-prompt">Review the plan before implementation continues.</div>
            {changesOpen && <label className="field"><span>Requested changes</span><textarea rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} /></label>}
            <div className="inline-actions approval-actions">
              <button className="button danger-subtle small" disabled={mutatingDisabled} onClick={() => rejectStep(workflow.id)}>Reject</button>
              <button className="button secondary small" disabled={mutatingDisabled} onClick={() => changesOpen ? requestChanges(workflow.id, feedback) : setChangesOpen(true)}>{changesOpen ? "Send changes" : "Request changes"}</button>
              <button className="button primary small" disabled={mutatingDisabled} onClick={() => approveStep(workflow.id)}><Check size={14} /> Approve plan</button>
            </div>
          </div>}
          {step.status === "completed" && <>
            <p className="step-description">The step completed successfully. Review any generated outputs below.</p>
            {step.artifacts.length ? <ArtifactList artifacts={step.artifacts} onOpen={openArtifact} /> : <div className="no-artifacts"><Archive size={16} /> No artifacts were produced by this step.</div>}
            <div className="step-details"><div><span>Agent</span><strong>{workflow.agent}</strong></div><div><span>Execution</span><strong>{workflow.execution === "local" ? "Local" : "Cloud Agent"}</strong></div></div>
            <button className="button ghost small" disabled={mutatingDisabled} onClick={() => restartStep(workflow.id, step.id)}><RefreshCcw size={14} /> Retry step</button>
          </>}
          {step.status === "pending" && <div className="pending-state"><Clock3 size={16} /> This step will begin after the preceding stage completes.</div>}
          {step.status === "cancelled" && <div className="state-callout gray"><Square size={19} /><div><strong>Step cancelled</strong><p>This step did not run because the workflow was cancelled.</p></div></div>}
        </div>}
      </div>
    </div>
  );
}

function ArtifactList({ artifacts, onOpen }: { artifacts: Artifact[]; onOpen: (artifact: Artifact) => void }) {
  return <div className="artifact-list"><span className="artifact-list-label">Artifacts ({artifacts.length})</span>{artifacts.map((artifact) => <button key={artifact.id} className="artifact-row" onClick={() => onOpen(artifact)}><span className="artifact-icon"><FileText size={18} /></span><span><strong>{artifact.name}</strong><small>Markdown · {artifact.versions.length} {artifact.versions.length === 1 ? "version" : "versions"}</small></span><span>View</span><ChevronRight size={16} /></button>)}</div>;
}

function ArtifactDrawer() {
  const { artifactSelection, closeArtifact } = usePrototype();
  const [editOpen, setEditOpen] = useState(false);
  const [prompt, setPrompt] = useState("Tighten the summary and emphasize validation outcomes.");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [editedContent, setEditedContent] = useState("");
  const artifact = artifactSelection?.artifact;
  const selected = artifact?.versions[0];

  useEffect(() => {
    if (!artifact || !selected) return;
    setEditOpen(false);
    setMessages([]);
    setEditedContent(selected.content);
  }, [artifact, selected]);

  if (!artifact || !selected) return null;

  const applyPrompt = () => {
    if (!prompt.trim()) return;
    const nextContent = `${editedContent}\n\n## AI edit request\n\n${prompt}\n\n## Updated note\n\nThis artifact was updated by simulated AI editing in Forge. Manual editing is intentionally disabled in this prototype.`;
    setMessages((current) => [
      ...current,
      { role: "user", content: prompt },
      { role: "assistant", content: "Updated the artifact with a concise refinement pass." },
    ]);
    setEditedContent(nextContent);
    setPrompt("");
  };

  return (
    <>
      <div className="drawer-scrim" onClick={closeArtifact} />
      <aside className="artifact-drawer" aria-label={`Artifact ${artifact.name}`}>
        <div className="drawer-header"><div className="drawer-title"><span className="artifact-icon"><KendoIcon icon={fileIcon} /></span><div><strong>{artifact.name}</strong><small>Markdown artifact</small></div></div><button className="icon-button" onClick={closeArtifact} aria-label="Close artifact"><X size={19} /></button></div>
        <div className="drawer-toolbar">
          <span>Created {selected.createdAt}</span>
          {!editOpen && <button className="button secondary small" onClick={() => setEditOpen(true)}>Edit</button>}
        </div>
        {editOpen && <div className="artifact-ai-panel">
          <div className="artifact-chat-log">
            {messages.length ? messages.map((item, index) => <div key={index} className={`artifact-chat-line ${item.role}`}><strong>{item.role === "user" ? <><KendoIcon icon={pauseIcon} className="kendo-inline-icon" /> You</> : <><KendoIcon icon={checkCircleIcon} className="kendo-inline-icon" /> Forge AI</>}</strong><p>{item.content}</p></div>) : <div className="artifact-chat-empty">Prompt the artifact to simulate an AI edit. Manual edits are disabled.</div>}
          </div>
          <div className="artifact-prompt-row">
            <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the edit you want..." />
            <button className="button primary small" onClick={applyPrompt}><KendoIcon icon={playIcon} className="kendo-inline-icon" /> Apply</button>
          </div>
        </div>}
        <div className="markdown-viewer"><Markdown content={editedContent} /></div>
      </aside>
    </>
  );
}

function Markdown({ content }: { content: string }) {
  const blocks = content.split("\n");
  const elements: ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (!list.length) return;
    elements.push(<ul key={`list-${elements.length}`}>{list.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</ul>);
    list = [];
  };
  blocks.forEach((line, index) => {
    if (line.startsWith("- ")) { list.push(line.slice(2)); return; }
    flushList();
    if (!line.trim()) return;
    if (line.startsWith("# ")) elements.push(<h1 key={index}>{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) elements.push(<h2 key={index}>{line.slice(3)}</h2>);
    else if (/^\d+\. /.test(line)) elements.push(<div className="numbered-line" key={index}>{inlineMarkdown(line)}</div>);
    else if (line.startsWith("> ")) elements.push(<blockquote key={index}>{line.slice(2)}</blockquote>);
    else if (line.startsWith("|")) elements.push(<pre className="markdown-table" key={index}>{line}</pre>);
    else elements.push(<p key={index}>{inlineMarkdown(line)}</p>);
  });
  flushList();
  return <>{elements}</>;
}

function inlineMarkdown(value: string) {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function ProjectSettingsPage() {
  const { projectId } = useParams();
  const { projects, role } = usePrototype();
  const [activeTab, setActiveTab] = useState<"repository" | "integrations" | "agents" | "models" | "workflows">("repository");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const project = projects.find((item) => item.id === projectId)!;
  if (role !== "admin") return <div className="access-state"><ShieldCheck size={32} /><h1>Admin access required</h1><p>Switch the prototype role to Admin to explore project configuration.</p></div>;

  const simulateSave = () => {
    setSaveState("saving");
    window.setTimeout(() => setSaveState("saved"), 650);
    window.setTimeout(() => setSaveState("idle"), 1800);
  };

  const renderTab = () => {
    if (activeTab === "repository") {
      return (
        <>
          <div className="settings-section"><h2>Repository</h2><p>Connect project context used by Forge workflows.</p><label className="field"><span>Repository URL</span><input defaultValue={`https://${project.repository}`} /></label><label className="field"><span>Default branch</span><input defaultValue="main" /></label></div>
          <div className="settings-section"><h2>Execution defaults</h2><p>Choose representative defaults for new workflow runs.</p><label className="field"><span>Default execution</span><select defaultValue="local"><option value="local">Local engine</option><option value="cloud">Cloud Agent</option></select></label><label className="toggle-row"><span><strong>Require plan approval</strong><small>Pause workflows before implementation starts.</small></span><input type="checkbox" defaultChecked /></label></div>
        </>
      );
    }
    if (activeTab === "integrations") {
      return (
        <div className="settings-section"><h2>Integrations</h2><p>Mock connection settings for source and tracker services.</p><label className="field"><span>Code platform</span><select defaultValue="github"><option value="github">GitHub</option><option value="gitlab">GitLab</option><option value="bitbucket">Bitbucket</option></select></label><label className="field"><span>Issue tracker</span><select defaultValue="github_issues"><option value="github_issues">GitHub Issues</option><option value="jira">Jira</option><option value="azure_devops">Azure DevOps</option></select></label><label className="toggle-row"><span><strong>Auto-check integrations</strong><small>Run simulated checks during setup and before workflow start.</small></span><input type="checkbox" defaultChecked /></label></div>
      );
    }
    if (activeTab === "agents") {
      return (
        <div className="settings-section"><h2>Coding agents</h2><p>Pick default coding agent behavior for this project.</p><label className="field"><span>Default agent</span><select defaultValue="github_copilot"><option value="github_copilot">GitHub Copilot</option><option value="claude_code">Claude Code</option><option value="opencode">OpenCode</option></select></label><label className="toggle-row"><span><strong>Require authentication</strong><small>Block workflow start if selected agent is not authenticated.</small></span><input type="checkbox" defaultChecked /></label><label className="toggle-row"><span><strong>Allow local fallback</strong><small>Use local execution when cloud capacity is unavailable.</small></span><input type="checkbox" defaultChecked /></label></div>
      );
    }
    if (activeTab === "models") {
      return (
        <div className="settings-section"><h2>Models</h2><p>Set profile defaults for new workflow runs.</p><label className="field"><span>Default model profile</span><select defaultValue="stable"><option value="stable">Stable</option><option value="balanced">Balanced</option><option value="lite">Lite</option></select></label><label className="field"><span>Temperature (simulated)</span><input defaultValue="0.2" /></label><label className="toggle-row"><span><strong>Allow profile override</strong><small>Let users switch model profile per workflow.</small></span><input type="checkbox" defaultChecked /></label></div>
      );
    }
    return (
      <div className="settings-section"><h2>Workflows</h2><p>Configure defaults for workflow orchestration behavior.</p><label className="field"><span>Default workflow template</span><select defaultValue="issue-pr"><option value="issue-pr">Issue → Pull Request</option><option value="issue-only">Issue analysis only</option><option value="custom">Custom (coming soon)</option></select></label><label className="field"><span>Concurrency limit (simulated)</span><input defaultValue="2" /></label><label className="toggle-row"><span><strong>Auto-summarize outcomes</strong><small>Generate a completion summary for each finished run.</small></span><input type="checkbox" defaultChecked /></label></div>
    );
  };

  return (
    <>
      <PageHeader
        title="Project configuration"
        description="Representative settings for where Forge project configuration would live."
        actions={
          <button className="button primary" onClick={simulateSave} disabled={saveState === "saving"}>
            {saveState === "saving" ? <><LoaderCircle size={15} /> Saving...</> : saveState === "saved" ? <><Check size={15} /> Saved</> : "Save changes"}
          </button>
        }
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          <button className={activeTab === "repository" ? "active" : ""} onClick={() => setActiveTab("repository")}><Box size={16} /> Repository</button>
          <button className={activeTab === "integrations" ? "active" : ""} onClick={() => setActiveTab("integrations")}><Code2 size={16} /> Integrations</button>
          <button className={activeTab === "agents" ? "active" : ""} onClick={() => setActiveTab("agents")}><Bot size={16} /> Coding agents</button>
          <button className={activeTab === "models" ? "active" : ""} onClick={() => setActiveTab("models")}><Sparkles size={16} /> Models</button>
          <button className={activeTab === "workflows" ? "active" : ""} onClick={() => setActiveTab("workflows")}><GitPullRequest size={16} /> Workflows</button>
        </nav>
        <div className="settings-panel panel">
          {renderTab()}
          {saveState === "saved" && <div className="prototype-notice"><CheckCircle2 size={17} /><span>Settings saved successfully (simulated).</span></div>}
        </div>
      </div>
    </>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span><Icon size={23} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
