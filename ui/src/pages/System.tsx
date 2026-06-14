import {
  Activity,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  GitBranch,
  Network,
  PlugZap,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { useCompany } from "../context/CompanyContext";
import { useInboxBadge } from "../hooks/useInboxBadge";
import { heartbeatsApi } from "../api/heartbeats";
import { instanceSettingsApi } from "../api/instanceSettings";
import { queryKeys } from "../lib/queryKeys";
import { cn } from "../lib/utils";

const systemLinks = [
  {
    title: "Connections",
    description: "Adapters, providers, and service wiring for Hermes and worker runtimes.",
    to: "/company/settings/instance/adapters",
    icon: PlugZap,
    status: "ready",
  },
  {
    title: "Runtime",
    description: "Execution workspaces, runtime services, logs, and local process surfaces.",
    to: "/workspaces",
    icon: GitBranch,
    status: "unknown",
  },
  {
    title: "Approvals",
    description: "Human approval gates and blocked work that needs an operator decision.",
    to: "/approvals/pending",
    icon: ShieldCheck,
    status: "attention",
  },
  {
    title: "Teams",
    description: "Org map, worker teams, and accountability structure for project execution.",
    to: "/org",
    icon: Users,
    status: "ready",
  },
  {
    title: "Skills",
    description: "Reusable capabilities, skill catalogs, and worker installation targets.",
    to: "/skills",
    icon: Boxes,
    status: "ready",
  },
  {
    title: "Costs",
    description: "Budget visibility and spend telemetry for control-plane operations.",
    to: "/costs",
    icon: CircleDollarSign,
    status: "ready",
  },
  {
    title: "Activity",
    description: "Recent operational events and audit-style timeline for the workspace.",
    to: "/activity",
    icon: Activity,
    status: "ready",
  },
  {
    title: "Settings",
    description: "Company, instance, experimental, plugin, and adapter configuration.",
    to: "/company/settings",
    icon: Settings,
    status: "ready",
  },
] as const;

function statusClass(status: "ready" | "attention" | "unknown") {
  if (status === "ready") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "attention") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-muted-foreground/20 bg-muted text-muted-foreground";
}

export function System() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const inboxBadge = useInboxBadge(selectedCompanyId);

  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 10_000,
  });

  const liveRunCount = liveRuns?.length ?? 0;
  const runtimeEnabled = experimentalSettings?.enableIsolatedWorkspaces === true;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-l-4 border-l-emerald-500 p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">KALI OS system</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Control the local agentic runtime.</h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                One operational home for connections, runtime workspaces, approvals, teams, skills, costs, activity, and settings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/dashboard/live">View live runs</Link>
              </Button>
              <Button asChild>
                <Link to="/company/settings">Open settings</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatusPanel label="Company" value={selectedCompany?.name ?? "No company selected"} tone="ready" />
        <StatusPanel label="Live runs" value={`${liveRunCount} active`} tone={liveRunCount > 0 ? "ready" : "unknown"} />
        <StatusPanel
          label="Attention"
          value={inboxBadge.failedRuns > 0 ? `${inboxBadge.failedRuns} failed runs` : "No failed runs"}
          tone={inboxBadge.failedRuns > 0 ? "attention" : "ready"}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemLinks.map((item) => {
          const Icon = item.icon;
          const status = item.title === "Runtime" && runtimeEnabled ? "ready" : item.status;
          return (
            <Link
              key={item.title}
              to={item.to}
              className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl border border-border bg-muted p-2 text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", statusClass(status))}>
                  {status === "ready" ? "Ready" : status === "attention" ? "Review" : "Available"}
                </span>
              </div>
              <h2 className="mt-5 text-base font-semibold text-foreground group-hover:underline">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

function StatusPanel({ label, value, tone }: { label: string; value: string; tone: "ready" | "attention" | "unknown" }) {
  return (
    <div className={cn("rounded-xl border bg-background p-4", tone === "ready" ? "border-emerald-500/30" : tone === "attention" ? "border-amber-500/40" : "border-border")}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <CheckCircle2 className={cn("h-4 w-4", tone === "ready" ? "text-emerald-500" : tone === "attention" ? "text-amber-500" : "text-muted-foreground")} />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
