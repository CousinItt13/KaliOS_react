import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, Boxes, Brain, Database, ExternalLink, Network, RefreshCw } from "lucide-react";
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

function ConnectionCard({ service }: { service: KaliServiceStatus }) {
  const Icon = icons[service.key] ?? Activity;
  const isHealthy = service.state === "online" || service.state === "managed";
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{service.label}</h2>
            <p className="text-xs text-muted-foreground">{service.key}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            isHealthy
              ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
              : service.state === "disabled"
                ? "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                : "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300"
          }`}
        >
          {service.state}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-xs">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Health result</dt>
          <dd className="text-right text-foreground">{service.detail}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Latency</dt>
          <dd className="text-right text-foreground">{service.latencyMs === null ? "—" : `${service.latencyMs} ms`}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Checked</dt>
          <dd className="text-right text-foreground">{new Date(service.checkedAt).toLocaleTimeString()}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Environment</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(envKeys[service.key] ?? []).map((key) => (
            <code key={key} className="rounded border border-border bg-muted/40 px-2 py-1 text-[10px]">
              {key}
            </code>
          ))}
        </div>
      </div>

      {service.publicUrl ? (
        <a
          href={service.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium underline-offset-4 hover:underline"
        >
          Open public interface
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="mt-4 text-[11px] text-muted-foreground">No browser-facing public URL configured.</p>
      )}
    </article>
  );
}

export function KaliConnections() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "Connections" }]);
  }, [setBreadcrumbs]);

  const statusQuery = useQuery({
    queryKey: ["kalios2", "status"],
    queryFn: () => kaliosApi.status(),
    retry: false,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">KaliOS2 Phase 1</p>
            <h1 className="mt-2 text-2xl font-semibold">Connections</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Server-side health and integration configuration for Hermes, local models, vector memory, knowledge, and runtime services. Secret values are never returned to this page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void statusQuery.refetch()}
            disabled={statusQuery.isFetching}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statusQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh health
          </button>
        </div>
      </section>

      {statusQuery.error ? (
        <div className="rounded-md border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {statusQuery.error.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(statusQuery.data?.services ?? []).map((service) => (
          <ConnectionCard key={service.key} service={service} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Phase 1 security model</h2>
        <div className="mt-3 grid gap-3 text-xs leading-5 text-muted-foreground md:grid-cols-3">
          <p><strong className="text-foreground">Browser:</strong> UI and scoped Paperclip APIs only.</p>
          <p><strong className="text-foreground">KaliOS2 server:</strong> health probes and Hermes chat proxy.</p>
          <p><strong className="text-foreground">Hermes:</strong> privileged model routing, secrets, Docker authority, and long-term knowledge writes.</p>
        </div>
      </section>
    </div>
  );
}
