import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  Boxes,
  Brain,
  CheckCircle2,
  Clock3,
  Database,
  FolderKanban,
  Network,
  RadioTower,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Link } from "@/lib/router";
import { ActiveAgentsPanel } from "../components/ActiveAgentsPanel";
import { EmptyState } from "../components/EmptyState";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { healthApi } from "../api/health";
import { agentsApi } from "../api/agents";
import { projectsApi } from "../api/projects";
import { issuesApi } from "../api/issues";
import { heartbeatsApi } from "../api/heartbeats";
import { queryKeys } from "../lib/queryKeys";

const DASHBOARD_LIVE_RUN_LIMIT = 50;

type PlaneStatus = "online" | "managed" | "planned" | "attention";

const statusStyle: Record<PlaneStatus, string> = {
  online: "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  managed: "border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  planned: "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  attention: "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300",
};

function ControlPlaneCard({
  icon: Icon,
  title,
  status,
  statusLabel,
  description,
}: {
  icon: typeof Activity;
  title: string;
  status: PlaneStatus;
  statusLabel: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40">
          <Icon className="h-4 w-4" />
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle[status]}`}>
          {statusLabel}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  value,
  label,
  detail,
  to,
}: {
  icon: typeof Activity;
  value: number;
  label: string;
  detail: string;
  to: string;
}) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-card p-4 text-inherit no-underline transition-colors hover:bg-accent/30">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Link>
  );
}

export function DashboardLive() {
  const { selectedCompanyId, companies, selectedCompany } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Overview", href: "/dashboard" },
      { label: "Control plane" },
    ]);
  }, [setBreadcrumbs]);

  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
    retry: false,
  });

  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const issuesQuery = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const liveRunsQuery = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 10_000,
  });

  const activeWorkerCount = useMemo(
    () => new Set((liveRunsQuery.data ?? []).map((run) => run.agentId)).size,
    [liveRunsQuery.data],
  );
  const blockedTaskCount = useMemo(
    () => (issuesQuery.data ?? []).filter((task) => task.blockerAttention).length,
    [issuesQuery.data],
  );
  const workerErrorCount = useMemo(
    () => (agentsQuery.data ?? []).filter((worker) => worker.status === "error").length,
    [agentsQuery.data],
  );

  if (!selectedCompanyId) {
    return (
      <EmptyState
        icon={RadioTower}
        message={companies.length === 0 ? "Create a company to open the KaliOS control plane." : "Select a company to open the KaliOS control plane."}
      />
    );
  }

  const paperclipOnline = healthQuery.data?.status === "ok";
  const deploymentDetail = healthQuery.data
    ? `${healthQuery.data.deploymentMode ?? "unknown mode"} · ${healthQuery.data.deploymentExposure ?? "unknown exposure"}`
    : "Health endpoint unavailable";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_42%)] px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Local-first agentic control plane
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">KaliOS Operations</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {selectedCompany?.name ?? "Current company"}: projects, workers, task pressure, live execution, and infrastructure integration in one operational surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link to="/company/settings/instance/adapters" className="rounded-md border border-border bg-background px-3 py-2 text-foreground no-underline hover:bg-accent">
                Connections
              </Link>
              <Link to="/workspaces" className="rounded-md border border-border bg-background px-3 py-2 text-foreground no-underline hover:bg-accent">
                Runtime
              </Link>
              <Link to="/approvals/pending" className="rounded-md border border-border bg-background px-3 py-2 text-foreground no-underline hover:bg-accent">
                Approvals
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <SignalCard icon={Activity} value={liveRunsQuery.data?.length ?? 0} label="Live runs" detail="Currently reported executions" to="/dashboard/live" />
          <SignalCard icon={Bot} value={activeWorkerCount} label="Active workers" detail={`${agentsQuery.data?.length ?? 0} workers registered`} to="/agents/all" />
          <SignalCard icon={FolderKanban} value={projectsQuery.data?.length ?? 0} label="Projects" detail="Delivery workspaces in this company" to="/projects" />
          <SignalCard icon={TriangleAlert} value={blockedTaskCount + workerErrorCount} label="Needs attention" detail={`${blockedTaskCount} blocked tasks · ${workerErrorCount} worker errors`} to="/inbox/blocked" />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Control-plane services</h2>
            <p className="text-xs text-muted-foreground">Only services with a real health signal are shown as online.</p>
          </div>
          <span className="text-xs text-muted-foreground">Paperclip {healthQuery.data?.version ? `v${healthQuery.data.version}` : "version unknown"}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ControlPlaneCard
            icon={CheckCircle2}
            title="Paperclip core"
            status={paperclipOnline ? "online" : "attention"}
            statusLabel={paperclipOnline ? "Online" : "Unavailable"}
            description={deploymentDetail}
          />
          <ControlPlaneCard
            icon={Network}
            title="Hermes gateway"
            status="planned"
            statusLabel="Not connected"
            description="The privileged Hermes adapter and health endpoint are the next integration boundary. No Docker or secret access is exposed to the browser."
          />
          <ControlPlaneCard
            icon={Boxes}
            title="Docker runtime"
            status="managed"
            statusLabel="Via Hermes"
            description="Container lifecycle will be normalized through Hermes instead of giving the React application direct Docker socket access."
          />
          <ControlPlaneCard
            icon={Brain}
            title="KALI Brain"
            status="planned"
            statusLabel="Not connected"
            description="Obsidian-backed project notes, decisions, reports, and graph-memory links will appear here after the knowledge adapter is wired."
          />
          <ControlPlaneCard
            icon={Database}
            title="Operational data"
            status={paperclipOnline ? "managed" : "attention"}
            statusLabel={paperclipOnline ? "API managed" : "Unknown"}
            description="Project, worker, task, approval, artifact, and cost data remains behind the Paperclip server boundary."
          />
          <ControlPlaneCard
            icon={ShieldCheck}
            title="Security boundary"
            status="managed"
            statusLabel="Local first"
            description="The UI consumes scoped APIs. Provider credentials and future infrastructure mutations remain server-side."
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Worker execution</h2>
            <p className="text-xs text-muted-foreground">Active runs first, followed by recent execution history.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Refreshes every 10 seconds
          </span>
        </div>

        <ActiveAgentsPanel
          companyId={selectedCompanyId}
          title="Active and recent workers"
          minRunCount={DASHBOARD_LIVE_RUN_LIMIT}
          fetchLimit={DASHBOARD_LIVE_RUN_LIMIT}
          cardLimit={DASHBOARD_LIVE_RUN_LIMIT}
          gridClassName="gap-3 md:grid-cols-2 2xl:grid-cols-3"
          cardClassName="h-[420px]"
          emptyMessage="No active or recent worker runs."
          queryScope="dashboard-live"
          showMoreLink={false}
        />
      </section>
    </div>
  );
}
