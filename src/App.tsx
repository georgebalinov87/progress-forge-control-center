import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
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
  const {
    projects,
    workflows,
    issues,
    backlogReadyByProject,
    role,
    setRole,
    resetDemo,
    showDemoControls,
  } = usePrototype();
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [workflowsExpanded, setWorkflowsExpanded] = useState(false);

  const projectWorkflows = workflows.filter((workflow) => workflow.projectId === project.id);
  const activeWorkflows = projectWorkflows.filter((workflow) =>
    ["running", "waiting", "paused"].includes(workflow.status),
  );
  const waitingCount = projectWorkflows.filter((workflow) => workflow.status === "waiting").length;
  const importedIssues = issues.filter((issue) => issue.projectId === project.id);
  const issuesImported = backlogReadyByProject[project.id] ?? false;

  useEffect(() => {
    setSidebarOpen(false);
    setProjectMenuOpen(false);
    setDemoMenuOpen(false);
    setWorkflowsExpanded(false);
  }, [location.pathname]);

  const menuItems = [
    {
      to: `/projects/${project.id}`,
      icon: Home,
      title: "Overview",
      detail: activeWorkflows.length
        ? `${activeWorkflows.length} active workflows`
        : "No active workflows",
      end: true,
    },
    {
      to: `/projects/${project.id}/issues`,
      icon: Inbox,
      title: "Issues",
      detail: issuesImported
        ? `${importedIssues.filter((issue) => issue.status === "open").length} open issues`
        : "Backlog import required",
      end: false,
    },
    {
      to: `/projects/${project.id}/workflows`,
      icon: GitPullRequest,
      title: "Workflows",
      detail: waitingCount ? `${waitingCount} need input` : "No blocked runs",
      end: false,
      expandable: true,
    },
    {
      to: `/projects/${project.id}/settings`,
      icon: Settings,
      title: "Configuration",
      detail: "Model and workflow defaults",
      end: false,
    },
  ];

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
        <div className="repo-switcher-wrap">
          <button
            className="repo-switcher"
            onClick={() => setProjectMenuOpen((value) => !value)}
            aria-expanded={projectMenuOpen}
          >
            <span className="repo-title-copy">
              <strong>{project.name}</strong>
              <small>{project.repository}</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {projectMenuOpen && (
            <div className="repo-switcher-popover">
              <span className="sidebar-label">Recent projects</span>
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
                    </Link>
                  );
                })}
              </nav>
              <Link className="sidebar-action" to={`/setup/welcome?returnTo=${project.id}`}>
                <Plus size={16} />
                Add project
              </Link>
            </div>
          )}
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-menu" aria-label="Main">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to} className="sidebar-menu-item">
                <NavLink
                  end={item.end}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "sidebar-menu-link active" : "sidebar-menu-link"
                  }
                >
                  <span className="sidebar-menu-icon"><Icon size={16} /></span>
                  <span className="sidebar-menu-copy">
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  {item.expandable && (
                    <button
                      type="button"
                      className="sidebar-expander"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setWorkflowsExpanded((value) => !value);
                      }}
                      aria-label={workflowsExpanded ? "Collapse workflows" : "Expand workflows"}
                    >
                      <ChevronDown size={14} className={workflowsExpanded ? "rotate" : ""} />
                    </button>
                  )}
                </NavLink>
                {item.expandable && workflowsExpanded && (
                  <div className="sidebar-sublist">
                    {projectWorkflows.slice(0, 4).map((workflow) => (
                      <Link key={workflow.id} to={`/projects/${project.id}/workflows/${workflow.id}`} className="sidebar-subitem">
                        <span className={`status-dot ${workflow.status}`} />
                        <span>{workflow.workflowName}</span>
                      </Link>
                    ))}
                    {!projectWorkflows.length && <span className="sidebar-subitem muted">No workflows yet</span>}
                    <Link to={`/projects/${project.id}/workflows`} className="sidebar-subitem view-all">View all workflows</Link>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="user-chip sidebar-user-chip">
            <span className="user-avatar">SS</span>
            <span>
              <strong>Stefan</strong>
              <small>{role === "read-only" ? "Observer" : role === "admin" ? "Admin" : "Active"}</small>
            </span>
          </div>
          {showDemoControls && <div className="demo-menu-wrap">
            <button
              className="icon-button"
              aria-label="Demo options"
              onClick={() => setDemoMenuOpen((value) => !value)}
            >
              <MoreHorizontal size={18} />
            </button>
            {demoMenuOpen && (
              <div className="demo-menu-popover">
                <label className="field">
                  <span>Prototype role</span>
                  <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                    <option value="read-only">Read-only</option>
                    <option value="active">Active</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button className="reset-button" onClick={resetDemo}>
                  <RotateCcw size={14} />
                  Reset demo
                </button>
              </div>
            )}
          </div>}
        </div>
      </aside>
      <div className="main-column">
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
    <>
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
      <DemoControlsToggle />
    </>
  );
}

function DemoControlsToggle() {
  const { showDemoControls, setShowDemoControls } = usePrototype();

  return (
    <button
      type="button"
      className="demo-controls-toggle"
      onClick={() => setShowDemoControls(!showDemoControls)}
    >
      {showDemoControls ? "Hide demo controls" : "Demo controls available"}
    </button>
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
          <h3>#{workflow.issueId} · {issue?.title ?? "Customer supplied issue"}</h3>
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
      <span className="row-main"><strong>{workflow.workflowName}</strong><small>#{workflow.issueId} · {issue?.title ?? "Customer supplied issue"}</small></span>
      <span className="row-person">{workflow.startedBy}</span>
      <StatusBadge status={workflow.status} />
      <span className="row-step">{current.number}/{workflow.steps.length} · {current.step.name}</span>
      <ChevronRight size={17} />
    </Link>
  );
}

function IssuesPage() {
  const { projectId } = useParams();
  const { issues, workflows, backlogReadyByProject, runBacklogImport } = usePrototype();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [backlogLoading, setBacklogLoading] = useState(false);
  const backlogReady = projectId ? backlogReadyByProject[projectId] ?? false : false;
  const projectIssues = issues.filter(
    (issue) =>
      issue.projectId === projectId &&
      (filter === "all" || issue.status === filter) &&
      `${issue.id} ${issue.title}`.toLowerCase().includes(search.toLowerCase()),
  );

  const runBacklog = () => {
    if (!projectId) return;
    setBacklogLoading(true);
    window.setTimeout(() => {
      runBacklogImport(projectId);
      setBacklogLoading(false);
    }, 800);
  };

  return (
    <>
      <PageHeader title="Issues" description="Browse project work and start a Forge workflow." />
      {!backlogReady && (
        <div className="panel">
          <EmptyState
            icon={Inbox}
            title="No imported issues yet"
            description="Run Backlog once to import your issues. After import, you can select an issue or enter a different ID manually."
            action={
              <button className="button primary" disabled={backlogLoading} onClick={runBacklog}>
                {backlogLoading ? <><LoaderCircle size={15} /> Running Backlog...</> : <><Play size={15} /> Run Backlog command</>}
              </button>
            }
          />
        </div>
      )}
      {backlogLoading && (
        <div className="run-summary">
          <LoaderCircle size={16} />
          <span>Importing issues from backlog for this project...</span>
        </div>
      )}
      {backlogReady && (
        <>
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
      )}
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
      {startOpen && <StartWorkflowDialog projectId={issue.projectId} initialIssue={issue} onClose={() => setStartOpen(false)} />}
      {commandOpen && <RunCommandDialog projectId={issue.projectId} initialIssue={issue} onClose={() => setCommandOpen(false)} />}
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

type IssueReferenceState = {
  selectedIssueId: string;
  manualIssueId: string;
};

function IssueReferenceField({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: IssueReferenceState;
  onChange: (next: IssueReferenceState) => void;
}) {
  const { issues, backlogReadyByProject } = usePrototype();
  const backlogReady = backlogReadyByProject[projectId] ?? false;
  const projectIssues = issues.filter((item) => item.projectId === projectId && item.status === "open");
  const usingManual = value.selectedIssueId === "manual" || !backlogReady || !projectIssues.length;

  return (
    <div className="issue-reference-field">
      <label className="field">
        <span>Issue ID</span>
        <p className="field-help">All workflows and commands run against a customer issue ID (GitHub, Jira, Azure DevOps, or other).</p>
        {backlogReady && projectIssues.length > 0 && (
          <select
            value={value.selectedIssueId}
            onChange={(event) => onChange({ ...value, selectedIssueId: event.target.value })}
          >
            {projectIssues.map((item) => (
              <option key={item.id} value={item.id}>#{item.id} · {item.title}</option>
            ))}
            <option value="manual">Use a different issue ID</option>
          </select>
        )}
        {usingManual && (
          <input
            value={value.manualIssueId}
            placeholder="Example: GH-1842 or FORGE-234"
            onChange={(event) => onChange({ ...value, manualIssueId: event.target.value })}
          />
        )}
      </label>
    </div>
  );
}

function resolveIssueSelection(selection: IssueReferenceState) {
  if (selection.selectedIssueId === "manual") return selection.manualIssueId.trim();
  return selection.selectedIssueId.trim() || selection.manualIssueId.trim();
}

function WorkflowCommandsEditor({
  steps,
  setSteps,
}: {
  steps: WorkflowStep[];
  setSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
}) {
  const [newCommand, setNewCommand] = useState<string>(workflowCommandCatalog[0].name);
  const [showCustomSoon, setShowCustomSoon] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

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
    setShowCustomSoon(false);
    setAddMenuOpen(false);
  };

  return (
    <div className="workflow-command-editor">
      <span className="editor-label">Workflow commands</span>
      <div className="command-grid workflow-command-list">
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
              <button className="icon-button drag-handle" aria-label="Drag command" title="Drag command">
                <GripVertical size={16} />
              </button>
              <button className="icon-button" onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label="Move step up">
                <ChevronUp size={16} />
              </button>
              <button className="icon-button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} aria-label="Move step down">
                <ChevronDown size={16} />
              </button>
              <button className="icon-button danger-icon" onClick={() => removeStep(index)} disabled={steps.length === 1} aria-label="Remove step">
                <KendoIcon icon={cancelCircleIcon} className="kendo-inline-icon" />
              </button>
            </div>
          </div>
        ))}
        <div className={`workflow-edit-add inline ${addMenuOpen ? "open" : ""}`}>
          {addMenuOpen ? (
            <>
              <label className="field">
                <span>Select command</span>
                <select value={newCommand} onChange={(event) => setNewCommand(event.target.value)}>
                  {workflowCommandCatalog.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                  <option value="custom">Custom step (Coming soon)</option>
                </select>
              </label>
              <div className="workflow-edit-add-actions">
                <button className="button ghost" onClick={() => setAddMenuOpen(false)}>Cancel</button>
                <button className="button secondary" onClick={addStep}><KendoIcon icon={playIcon} className="kendo-inline-icon" /> Add new command</button>
              </div>
            </>
          ) : (
            <button className="button secondary workflow-add-trigger" onClick={() => setAddMenuOpen(true)}>
              <Plus size={14} /> Add new command
            </button>
          )}
        </div>
      </div>
      {showCustomSoon && <div className="prototype-notice"><WandSparkles size={16} /><span>Custom step is coming soon in this prototype.</span></div>}
    </div>
  );
}

function StartWorkflowDialog({
  projectId,
  initialIssue,
  onClose,
}: {
  projectId: string;
  initialIssue?: Issue;
  onClose: () => void;
}) {
  const { issues, startWorkflow } = usePrototype();
  const navigate = useNavigate();
  const [issueRef, setIssueRef] = useState<IssueReferenceState>({
    selectedIssueId: initialIssue?.id ?? "manual",
    manualIssueId: initialIssue?.id ?? "",
  });
  const [workflowMode, setWorkflowMode] = useState<"existing" | "new">("existing");
  const [workflowName, setWorkflowName] = useState("Issue → Pull Request");
  const [steps, setSteps] = useState<WorkflowStep[]>(() =>
    workflowCommandCatalog.slice(0, 6).map((command, index) => ({
      id: `${command.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
      name: command.name,
      description: command.description,
      status: "pending",
      artifacts: [],
    })),
  );

  const issueId = resolveIssueSelection(issueRef);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!issueId) return;
    const selectedIssue = issues.find((item) => item.projectId === projectId && item.id === issueId);
    const workflowId = startWorkflow(projectId, issueId, "local", "GitHub Copilot", {
      workflowName: workflowMode === "new" ? workflowName : "Issue → Pull Request",
      issueTitle: selectedIssue?.title ?? initialIssue?.title,
      steps,
    });
    onClose();
    navigate(`/projects/${projectId}/workflows/${workflowId}`);
  };

  return (
    <Modal title="Start workflow" subtitle={<p className="modal-subtitle">Pick an issue ID and command plan.</p>} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="modal-body">
          <IssueReferenceField projectId={projectId} value={issueRef} onChange={setIssueRef} />
          <label className="field">
            <span>Workflow option</span>
            <select value={workflowMode} onChange={(event) => setWorkflowMode(event.target.value as "existing" | "new")}>
              <option value="existing">Use existing workflow</option>
              <option value="new">Create new workflow</option>
            </select>
          </label>
          {workflowMode === "new" && (
            <label className="field">
              <span>Workflow name</span>
              <input
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                placeholder="My custom workflow"
              />
            </label>
          )}
          <WorkflowCommandsEditor steps={steps} setSteps={setSteps} />
          <div className="run-summary"><Sparkles size={17} /><span>Forge will analyze the issue, create a plan, wait for approval, implement, validate, and prepare a pull request.</span></div>
        </div>
        <div className="modal-footer"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={!issueId}><Play size={15} /> Start workflow</button></div>
      </form>
    </Modal>
  );
}

type CommandStage = "picker" | "form" | "running" | "completed";

function RunCommandDialog({
  projectId,
  initialIssue,
  onClose,
}: {
  projectId: string;
  initialIssue?: Issue;
  onClose: () => void;
}) {
  const { openArtifact } = usePrototype();
  const [stage, setStage] = useState<CommandStage>("picker");
  const [command, setCommand] = useState<"ask" | "draft" | "review">("ask");
  const [question, setQuestion] = useState("What parts of authentication need to change?");
  const [progress, setProgress] = useState(12);
  const [issueRef, setIssueRef] = useState<IssueReferenceState>({
    selectedIssueId: initialIssue?.id ?? "manual",
    manualIssueId: initialIssue?.id ?? "",
  });
  const issueId = resolveIssueSelection(issueRef);
  const resultArtifact = useMemo<Artifact>(() => ({
    id: `command-${issueId || "manual"}`,
    name: command === "ask" ? "forge-response.md" : command === "draft" ? "issue-draft.md" : "review-summary.md",
    type: "markdown",
    versions: [{
      version: 1,
      label: "Current",
      createdAt: "Just now",
      content: command === "ask"
        ? `# Forge response\n\n## Issue\n\n${issueId}\n\n## Question\n\n${question}\n\n## Answer\n\nOAuth affects provider configuration, callback routing, authentication middleware, and session creation. The safest implementation keeps provider-specific behavior behind an adapter and preserves the current token path.\n\n## Recommended focus\n\n1. Validate callback state\n2. Normalize provider errors\n3. Add focused middleware tests`
        : command === "draft"
          ? `# Issue draft\n\n## Issue\n\n${issueId}\n\n## Summary\n\nAdd configurable OAuth authentication while preserving local token behavior.\n\n## Acceptance criteria\n\n- Provider settings are validated\n- Callback failures are actionable\n- Existing token authentication is unchanged\n- Focused tests cover success and failure`
          : `# Issue review\n\n## Issue\n\n${issueId}\n\n## Findings\n\nThe issue is implementation-ready. The main risk is coupling provider logic directly to middleware.\n\n## Recommendation\n\nUse a provider adapter and require callback-state validation.`,
    }],
  }), [command, issueId, question]);

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
          <IssueReferenceField projectId={projectId} value={issueRef} onChange={setIssueRef} />
          {command === "ask" && <label className="field"><span>Question</span><textarea rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} /></label>}
          {command !== "ask" && <div className="run-summary"><Sparkles size={17} /><span>Forge will use the issue context to generate a mock {command === "draft" ? "issue draft" : "readiness review"}.</span></div>}
        </div>}
        {stage === "running" && <div className="command-running"><span className="large-status blue"><LoaderCircle size={22} /> Running</span><h3>Analyzing issue context…</h3><p>Forge is preparing the command output and artifact.</p><ProgressBar value={progress} /><small>{progress}% complete</small></div>}
        {stage === "completed" && <div className="command-complete"><span className="large-status green"><CheckCircle2 size={22} /> Completed</span><h3>Command artifact is ready</h3><p>Review the generated Markdown without leaving this issue.</p><button className="artifact-row" onClick={() => openArtifact(resultArtifact)}><span className="artifact-icon"><FileText size={18} /></span><span><strong>{resultArtifact.name}</strong><small>Markdown · Created just now</small></span><span>View</span><ChevronRight size={16} /></button></div>}
      </div>
      <div className="modal-footer">
        {stage === "picker" && <button className="button ghost" onClick={onClose}>Cancel</button>}
        {stage === "form" && <><button className="button ghost" onClick={() => setStage("picker")}>Back</button><button className="button primary" disabled={!issueId} onClick={() => { setProgress(12); setStage("running"); }}><Play size={15} /> Run command</button></>}
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
  const [startOpen, setStartOpen] = useState(false);
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
        <div className="page-actions">
          <button className="button secondary"><ListFilter size={15} /> More filters</button>
          <button className="button primary" onClick={() => setStartOpen(true)}><Plus size={15} /> New workflow</button>
        </div>
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
              <td><strong>#{workflow.issueId}</strong><br /><span className="muted">{issue?.title ?? "Customer supplied issue"}</span></td>
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
      {startOpen && projectId && <StartWorkflowDialog projectId={projectId} onClose={() => setStartOpen(false)} />}
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
          <div><span className="eyebrow">Workflow run</span><h1>{workflow.workflowName}</h1><Link to={`/projects/${projectId}/issues/${workflow.issueId}`}>#{workflow.issueId} · {issue?.title ?? "Customer supplied issue"}</Link></div>
        </div>
        <div className="page-actions">
          {!(["running", "waiting", "paused"] as WorkflowStatus[]).includes(workflow.status) && (
            <button className="button secondary" disabled={role === "read-only"} onClick={() => setEditOpen(true)}><KendoIcon icon={gearIcon} className="kendo-inline-icon" /> Edit steps</button>
          )}
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
        <WorkflowCommandsEditor steps={steps} setSteps={setSteps} />
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
  const { projects } = usePrototype();
  const [activeTab, setActiveTab] = useState<"models" | "workflows">("models");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  const simulateSave = () => {
    setSaveState("saving");
    window.setTimeout(() => setSaveState("saved"), 650);
    window.setTimeout(() => setSaveState("idle"), 1800);
  };

  const renderTab = () => {
    if (activeTab === "models") {
      return (
        <div className="settings-section"><h2>Model</h2><p>Set the default model profile used by new workflow runs.</p><label className="field"><span>Default model profile</span><select defaultValue="stable"><option value="stable">Stable</option><option value="balanced">Balanced</option><option value="lite">Lite</option></select></label><label className="toggle-row"><span><strong>Allow profile override</strong><small>Let users switch the model profile per workflow.</small></span><input type="checkbox" defaultChecked /></label></div>
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
        description="Simple project settings for model and workflow defaults."
        actions={
          <button className="button primary" onClick={simulateSave} disabled={saveState === "saving"}>
            {saveState === "saving" ? <><LoaderCircle size={15} /> Saving...</> : saveState === "saved" ? <><Check size={15} /> Saved</> : "Save changes"}
          </button>
        }
      />
      <div className="settings-layout">
        <nav className="settings-nav">
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
