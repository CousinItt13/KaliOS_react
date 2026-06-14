import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, Boxes, Brain, CheckCircle2, Clock3, Database, ExternalLink, FileCode2, Network, RefreshCw } from "lucide-react";
import { kaliosApi, type KaliServiceStatus } from "../api/kalios";
import { useBreadcrumbs } from "../context/BreadcrumbContext";

const icons: Record<string, typeof Activity> = {
  hermes: Network,
  ollama: Bot,
  qdrant: Database,
  obsidian: Brain,
  "open-webui": Activity,
  docker: Boxes,
};

const envKeys: Record<string, string[]> = {
  hermes: ["KALIOS2_HERMES_URL", "KALIOS2_HERMES_TOKEN", "KALIOS2_HERMES_MODEL"],
  ollama: ["KALIOS2_OLLAMA_URL", "KALIOS2_OLLAMA_PUBLIC_URL"],
  qdrant: ["KALIOS2_QDRANT_URL", "KALIOS2_QDRANT_PUBLIC_URL"],
  obsidian: ["KALIOS2_OBSIDIAN_URL", "KALIOS2_OBSIDIAN_PUBLIC_URL"],
  "open-webui": ["KALIOS2_OPENWEBUI_URL", "KALIOS2_OPENWEBUI_PUBLIC_URL"],
  docker: ["KALIOS2_HERMES_URL"],
};

type SetupStatus = {
  updatedAt: string;
  mode: string;
  state: string;
  runningScript?: string | null;
  currentStep?: string | null;
  message?: string | null;
  steps?: Array<{ key: string; label: string; state: string; detail?: string | null }>;
  checks?: Array<{ key: string; label: string; state: string; detail?: string | null }>;
  containers?: Array<{ name: string; state: string; health?: string | null }>;
};

async function loadSetupStatus(): Promise<SetupStatus | null> {
  const response = await fetch(`/kalios-status/setup-status.json?t=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Setup status failed (${response.status})`);
  return response.json() as Promise<SetupStatus>;
}

function stateClasses(state: string) {
  if (["online", "managed", "success", "running", "healthy"].includes(state)) {
    return "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300";
  }
  if (["warning", "pending", "disabled", "starting", "skipped", "not_run"].includes(state)) {
    return "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300";
  }
  return "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300";
}

function StatePill({ state }: { state: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${stateClasses(state)}`}>{state}</span>;
}

function ConnectionCard({ service }: { service: KaliServiceStatus }) {
  const Icon = icons[service.key] ?? Activity;
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40"><Icon className="h-4 w-4" /></div>
          <div><h2 className="text-sm font-semibold">{service.label}</h2><p className="text-xs text-muted-foreground">{service.key}</p></div>
        </div>
        <StatePill state={service.state} />
      </div>
      <dl className="mt-5 grid gap-3 text-xs">
        <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Health result</dt><dd className="text-right text-foreground">{service.detail}</dd></div>
        <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Latency</dt><dd className="text-right text-foreground">{service.latencyMs === null ? "—" : `${service.latencyMs} ms`}</dd></div>
        <div className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">Checked</dt><dd className="text-right text-foreground">{new Date(service.checkedAt).toLocaleTimeString()}</dd></div>
      </dl>
      <div className="mt-5 border-t border-border pt-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Environment</p><div className="mt-2 flex flex-wrap gap-1.5">{(envKeys[service.key] ?? []).map((key) => <code key={key} className="rounded border border-border bg-muted/40 px-2 py-1 text-[10px]">{key}</code>)}</div></div>
      {service.publicUrl ? <a href={service.publicUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium underline-offset-4 hover:underline">Open public interface<ExternalLink className="h-3 w-3" /></a> : <p className="mt-4 text-[11px] text-muted-foreground">No browser-facing public URL configured.</p>}
    </article>
  );
}

const commands = [
  ["Automatic complete setup", "SETUP-KALIOS2-AUTO.bat"],
  ["Guided manual setup", "SETUP-KALIOS2-MANUAL.bat"],
  ["Start system", "START-KALIOS2.bat"],
  ["Check system", "CHECK-KALIOS2.bat"],
  ["Stop system", "STOP-KALIOS2.bat"],
] as const;

export function KaliConnections() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => { setBreadcrumbs([{ label: "Connections & Setup" }]); }, [setBreadcrumbs]);

  const statusQuery = useQuery({ queryKey: ["kalios2", "status"], queryFn: () => kaliosApi.status(), retry: false, refetchInterval: 15_000 });
  const setupQuery = useQuery({ queryKey: ["kalios2", "setup-status"], queryFn: loadSetupStatus, retry: false, refetchInterval: 10_000 });
  const setup = setupQuery.data;
  const services = statusQuery.data?.services ?? [];
  const healthy = services.filter((service) => ["online", "managed", "disabled"].includes(service.state)).length;
  const completed = setup?.steps?.filter((step) => ["success", "warning", "skipped"].includes(step.state)).length ?? 0;
  const progress = setup?.steps?.length ? Math.round((completed / setup.steps.length) * 100) : 0;

  const refresh = () => void Promise.all([statusQuery.refetch(), setupQuery.refetch()]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">KaliOS2 Phase 1</p><h1 className="mt-2 text-2xl font-semibold">Connections & Setup Board</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Live services, Hermes setup, active scripts, container checks, and operational commands. Secret values are never returned to this page.</p></div>
          <button type="button" onClick={refresh} disabled={statusQuery.isFetching || setupQuery.isFetching} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${(statusQuery.isFetching || setupQuery.isFetching) ? "animate-spin" : ""}`} />Refresh board</button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Overall</p><p className="mt-2 text-xl font-semibold">{setup?.state === "success" ? "Operational" : setup?.state === "running" ? "Setup running" : setup?.state === "stopped" ? "Stopped" : statusQuery.data ? "Needs verification" : "Unavailable"}</p></article>
        <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Running script</p><p className="mt-2 truncate text-xl font-semibold">{setup?.runningScript ?? "None"}</p></article>
        <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Healthy services</p><p className="mt-2 text-xl font-semibold">{healthy} / {services.length}</p></article>
        <article className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Last update</p><p className="mt-2 text-sm font-semibold">{setup?.updatedAt ? new Date(setup.updatedAt).toLocaleString() : statusQuery.data?.checkedAt ? new Date(statusQuery.data.checkedAt).toLocaleString() : "—"}</p></article>
      </section>

      {statusQuery.error ? <div className="rounded-md border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">{statusQuery.error.message}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <ConnectionCard key={service.key} service={service} />)}</section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /><h2 className="text-sm font-semibold">Setup execution</h2></div>{setup ? <StatePill state={setup.state} /> : null}</div><p className="mt-3 text-sm text-muted-foreground">{setup?.message ?? "No setup or check script has written status yet."}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div><div className="mt-4 space-y-2">{setup?.steps?.map((step) => <div key={step.key} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"><div><p className="text-xs font-medium">{step.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{step.detail || "No detail"}</p></div><StatePill state={step.state} /></div>) ?? <p className="text-xs text-muted-foreground">No setup steps recorded.</p>}</div></section>

          <section className="rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><h2 className="text-sm font-semibold">Latest checks</h2></div><div className="space-y-2">{setup?.checks?.map((check) => <div key={check.key} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"><div><p className="text-xs font-medium">{check.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{check.detail || "No detail"}</p></div><StatePill state={check.state} /></div>) ?? <p className="text-xs text-muted-foreground">Run CHECK-KALIOS2.bat to populate checks.</p>}</div></section>

          <section className="rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Boxes className="h-4 w-4" /><h2 className="text-sm font-semibold">Container snapshot</h2></div><div className="grid gap-3 md:grid-cols-2">{setup?.containers?.map((container) => <div key={container.name} className="rounded-lg border border-border bg-muted/20 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium">{container.name}</p><p className="mt-1 text-[11px] text-muted-foreground">Health: {container.health ?? "not reported"}</p></div><StatePill state={container.state} /></div></div>) ?? <p className="text-xs text-muted-foreground">No container snapshot recorded.</p>}</div></section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><FileCode2 className="h-4 w-4" /><h2 className="text-sm font-semibold">Setup commands</h2></div><div className="space-y-3">{commands.map(([label, command]) => <div key={command}><p className="mb-1 text-xs text-muted-foreground">{label}</p><code className="block overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-xs">{command}</code></div>)}</div></section>
          <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Hermes automatic creation</h2><ol className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>1. Create core and React environment files when missing.</li><li>2. Generate a strong Hermes API key when no usable key exists.</li><li>3. Store the matching token only in the React server environment.</li><li>4. Create the shared Docker network and start the core services.</li><li>5. Verify Hermes through the server-side status endpoint.</li></ol></section>
          <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Create local scripts</h2><p className="mt-3 text-xs leading-5 text-muted-foreground">The repository stores reviewed templates. Materialize them once after cloning:</p><code className="mt-3 block overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-xs">node scripts/kalios2/materialize-setup.mjs</code></section>
        </aside>
      </section>

      <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Phase 1 security model</h2><div className="mt-3 grid gap-3 text-xs leading-5 text-muted-foreground md:grid-cols-3"><p><strong className="text-foreground">Browser:</strong> UI, live status, and sanitized setup metadata only.</p><p><strong className="text-foreground">KaliOS React server:</strong> health probes and Hermes chat proxy.</p><p><strong className="text-foreground">Hermes:</strong> privileged model routing, secrets, Docker authority, and long-term knowledge writes.</p></div></section>
    </div>
  );
}
