import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  artifacts,
  initialWorkflows,
  issues as seededIssues,
  projects as seededProjects,
  workflowSteps,
} from "./data";
import type { Artifact, Issue, Project, Role, WorkflowRun, WorkflowStatus } from "./types";

type ArtifactSelection = { artifact: Artifact; version: number } | null;

type PrototypeContextValue = {
  projects: Project[];
  issues: Issue[];
  workflows: WorkflowRun[];
  role: Role;
  setRole: (role: Role) => void;
  artifactSelection: ArtifactSelection;
  openArtifact: (artifact: Artifact) => void;
  setArtifactVersion: (version: number) => void;
  closeArtifact: () => void;
  startWorkflow: (projectId: string, issueId: string, execution: "local" | "cloud", agent: string) => string;
  pauseWorkflow: (id: string) => void;
  resumeWorkflow: (id: string) => void;
  cancelWorkflow: (id: string) => void;
  retryStep: (workflowId: string, stepId: string) => void;
  restartStep: (workflowId: string, stepId: string) => void;
  setWorkflowSteps: (workflowId: string, steps: WorkflowRun["steps"]) => void;
  approveStep: (workflowId: string) => void;
  rejectStep: (workflowId: string) => void;
  requestChanges: (workflowId: string, feedback: string) => void;
  loadDemoWorkspace: () => void;
  addProject: (project: Project) => void;
  resetDemo: () => void;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

const cloneWorkflows = () => structuredClone(initialWorkflows);

const createProjectIssues = (project: Project): Issue[] => [
  {
    id: "101",
    projectId: project.id,
    title: "Add authentication health checks",
    description:
      "Add lightweight health checks for authentication dependencies and return actionable diagnostics when a provider is unavailable.",
    status: "open",
    assignee: "Stefan",
    labels: ["authentication", "reliability"],
  },
  {
    id: "102",
    projectId: project.id,
    title: "Improve setup error messages",
    description:
      "Make configuration and startup failures easier to understand, including a clear cause and recommended recovery action.",
    status: "open",
    assignee: "Elena",
    labels: ["developer-experience", "observability"],
  },
  {
    id: "103",
    projectId: project.id,
    title: "Add project activity summary",
    description:
      "Create a compact project summary showing recent changes, active work, and items that require attention.",
    status: "open",
    assignee: "Yoan",
    labels: ["feature", "user-experience"],
  },
  {
    id: "98",
    projectId: project.id,
    title: "Refactor configuration validation",
    description:
      "Separate configuration parsing from validation so errors can identify the exact invalid field.",
    status: "closed",
    assignee: "Stefan",
    labels: ["refactor"],
  },
];

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [role, setRole] = useState<Role>("active");
  const [artifactSelection, setArtifactSelection] = useState<ArtifactSelection>(null);

  const updateWorkflow = useCallback(
    (id: string, updater: (workflow: WorkflowRun) => WorkflowRun) => {
      setWorkflows((current) =>
        current.map((workflow) => (workflow.id === id ? updater(workflow) : workflow)),
      );
    },
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWorkflows((current) =>
        current.map((workflow) => {
          if (!workflow.simulated || workflow.status !== "running") return workflow;
          const runningIndex = workflow.steps.findIndex((item) => item.status === "running");
          if (runningIndex < 0) return workflow;
          const running = workflow.steps[runningIndex];
          const nextProgress = Math.min((running.progress ?? 0) + 12, 100);
          const steps = workflow.steps.map((item, index) =>
            index === runningIndex ? { ...item, progress: nextProgress } : item,
          );

          if (nextProgress < 100) return { ...workflow, steps };

          const completed = {
            ...steps[runningIndex],
            status: "completed" as const,
            progress: undefined,
            duration: running.id === "understand" ? "48s" : "1m 23s",
            activity: undefined,
            artifacts:
              running.id === "understand"
                ? [artifacts.analysis]
                : running.id === "plan"
                  ? [artifacts.plan, artifacts.affected]
                  : running.id === "validate"
                    ? [artifacts.tests]
                    : running.id === "review"
                      ? [artifacts.review, artifacts.pr]
                      : running.artifacts,
          };
          steps[runningIndex] = completed;

          if (running.id === "understand") {
            steps[runningIndex + 1] = {
              ...steps[runningIndex + 1],
              status: "running",
              progress: 8,
              activity: "Mapping affected authentication files and implementation steps…",
            };
          } else if (running.id === "plan") {
            steps[runningIndex + 1] = {
              ...steps[runningIndex + 1],
              status: "waiting",
              activity: "Waiting for your approval",
              artifacts: [artifacts.plan],
            };
            return { ...workflow, status: "waiting", steps };
          } else if (running.id === "implement") {
            steps[runningIndex + 1] = {
              ...steps[runningIndex + 1],
              status: "running",
              progress: 10,
              activity: "Running authentication tests and type checks…",
            };
          } else if (running.id === "validate" && !workflow.validationRetried) {
            steps[runningIndex] = {
              ...completed,
              status: "failed",
              artifacts: [],
              message: "3 tests failed during OAuth callback validation.",
            };
            return { ...workflow, status: "failed", steps };
          } else if (running.id === "validate") {
            steps[runningIndex + 1] = {
              ...steps[runningIndex + 1],
              status: "running",
              progress: 12,
              activity: "Reviewing the final diff and preparing pull request details…",
            };
          } else if (running.id === "review") {
            return { ...workflow, status: "completed", steps };
          }

          return { ...workflow, steps };
        }),
      );
    }, 900);
    return () => window.clearInterval(interval);
  }, []);

  const startWorkflow = useCallback(
    (projectId: string, issueId: string, execution: "local" | "cloud", agent: string) => {
      const id = `wf-${issueId}-${Date.now()}`;
      const steps = workflowSteps();
      steps[0] = {
        ...steps[0],
        status: "running",
        progress: 8,
        activity: "Reading the issue and identifying repository context…",
      };
      const workflow: WorkflowRun = {
        id,
        projectId,
        issueId,
        workflowName: "Issue → Pull Request",
        startedBy: "Stefan",
        execution,
        agent,
        status: "running",
        startedAt: "Just now",
        steps,
        simulated: true,
      };
      setWorkflows((current) => [workflow, ...current]);
      return id;
    },
    [],
  );

  const pauseWorkflow = (id: string) =>
    updateWorkflow(id, (workflow) => ({
      ...workflow,
      status: "paused",
      steps: workflow.steps.map((item) =>
        item.status === "running" ? { ...item, status: "paused" } : item,
      ),
    }));

  const resumeWorkflow = (id: string) =>
    updateWorkflow(id, (workflow) => ({
      ...workflow,
      status: "running",
      simulated: true,
      steps: workflow.steps.map((item) =>
        item.status === "paused" ? { ...item, status: "running" } : item,
      ),
    }));

  const cancelWorkflow = (id: string) =>
    updateWorkflow(id, (workflow) => ({
      ...workflow,
      status: "cancelled",
      steps: workflow.steps.map((item) =>
        ["running", "paused", "waiting", "pending"].includes(item.status)
          ? { ...item, status: item.status === "pending" ? "cancelled" : "cancelled" }
          : item,
      ),
    }));

  const retryStep = (workflowId: string, stepId: string) =>
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      status: "running",
      simulated: true,
      validationRetried: stepId === "validate" ? true : workflow.validationRetried,
      steps: workflow.steps.map((item) =>
        item.id === stepId
          ? {
              ...item,
              status: "running",
              progress: 8,
              message: undefined,
              activity: "Retrying with updated context and recovery guidance…",
            }
          : item,
      ),
    }));

  const restartStep = (workflowId: string, stepId: string) =>
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      status: "running",
      simulated: true,
      steps: workflow.steps.map((item) =>
        item.id === stepId
          ? { ...item, status: "running", progress: 5, activity: "Restarting this step…" }
          : item,
      ),
    }));

  const setWorkflowSteps = (workflowId: string, steps: WorkflowRun["steps"]) =>
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      steps,
      status: steps.some((step) => step.status === "running")
        ? "running"
        : steps.some((step) => step.status === "waiting")
          ? "waiting"
          : steps.some((step) => step.status === "failed")
            ? "failed"
            : workflow.status,
    }));

  const approveStep = (workflowId: string) =>
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      status: "running",
      simulated: true,
      steps: workflow.steps.map((item) => {
        if (item.id === "approval")
          return { ...item, status: "completed", duration: "Just now", activity: undefined };
        if (item.id === "implement")
          return {
            ...item,
            status: "running",
            progress: 7,
            activity: "Updating authentication middleware and provider configuration…",
          };
        return item;
      }),
    }));

  const rejectStep = (workflowId: string) =>
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      status: "cancelled",
      steps: workflow.steps.map((item) =>
        item.id === "approval"
          ? { ...item, status: "cancelled", message: "Plan rejected by reviewer." }
          : item.status === "pending"
            ? { ...item, status: "cancelled" }
            : item,
      ),
    }));

  const requestChanges = (workflowId: string, feedback: string) =>
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      status: "running",
      simulated: true,
      steps: workflow.steps.map((item) => {
        if (item.id === "approval") return { ...item, status: "pending", activity: undefined };
        if (item.id === "plan")
          return {
            ...item,
            status: "running",
            progress: 12,
            activity: `Revising the plan: ${feedback || "Reviewer requested changes."}`,
          };
        return item;
      }),
    }));

  const value = useMemo<PrototypeContextValue>(
    () => ({
      projects,
      issues,
      workflows,
      role,
      setRole,
      artifactSelection,
      openArtifact: (artifact) =>
        setArtifactSelection({ artifact, version: artifact.versions[0].version }),
      setArtifactVersion: (version) =>
        setArtifactSelection((current) => (current ? { ...current, version } : null)),
      closeArtifact: () => setArtifactSelection(null),
      startWorkflow,
      pauseWorkflow,
      resumeWorkflow,
      cancelWorkflow,
      retryStep,
      restartStep,
      setWorkflowSteps,
      approveStep,
      rejectStep,
      requestChanges,
      loadDemoWorkspace: () => {
        setProjects(structuredClone(seededProjects));
        setIssues(structuredClone(seededIssues));
        setWorkflows(cloneWorkflows());
        setArtifactSelection(null);
      },
      addProject: (project) => {
        setProjects((current) =>
          current.some((item) => item.id === project.id) ? current : [...current, project],
        );
        setIssues((current) =>
          current.some((item) => item.projectId === project.id)
            ? current
            : [...current, ...createProjectIssues(project)],
        );
      },
      resetDemo: () => {
        setProjects([]);
        setIssues([]);
        setWorkflows([]);
        setRole("active");
        setArtifactSelection(null);
      },
    }),
    [artifactSelection, issues, projects, role, startWorkflow, updateWorkflow, workflows],
  );

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) throw new Error("usePrototype must be used within PrototypeProvider");
  return context;
}

export const statusLabels: Record<WorkflowStatus, string> = {
  running: "Running",
  paused: "Paused",
  waiting: "Needs input",
  failed: "Failed",
  completed: "Completed",
  cancelled: "Cancelled",
};
