import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, ExternalLink, FileText, FolderKanban, Network, Search } from "lucide-react";
import { Link } from "@/lib/router";
import { kaliosApi } from "../api/kalios";
import { useBreadcrumbs } from "../context/BreadcrumbContext";

export function KaliBrain() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "KALI Brain" }]);
  }, [setBreadcrumbs]);

  const statusQuery = useQuery({
    queryKey: ["kalios2", "status"],
    queryFn: () => kaliosApi.status(),
    retry: false,
  });

  const obsidian = statusQuery.data?.services.find((service) => service.key === "obsidian") ?? null;
  const qdrant = statusQuery.data?.services.find((service) => service.key === "qdrant") ?? null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_45%)] p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/80">
            <Brain className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">KALI Brain</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Phase 1 combines Paperclip artifacts with the external Obsidian vault. PostgreSQL remains the operational source of truth; KALI Brain is the human-readable knowledge layer.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/artifacts" className="rounded-xl border border-border bg-card p-5 text-inherit no-underline hover:bg-accent/30">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold">Artifacts</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Reports, generated files, work products, and task outputs managed by Paperclip.</p>
        </Link>

        <Link to="/projects" className="rounded-xl border border-border bg-card p-5 text-inherit no-underline hover:bg-accent/30">
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold">Project knowledge</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Open a project to review tasks, goals, documents, comments, and work history.</p>
        </Link>

        <Link to="/search" className="rounded-xl border border-border bg-card p-5 text-inherit no-underline hover:bg-accent/30">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold">Search</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Search the operational task and project records already indexed by Paperclip.</p>
        </Link>

        <Link to="/activity" className="rounded-xl border border-border bg-card p-5 text-inherit no-underline hover:bg-accent/30">
          <Network className="h-5 w-5 text-muted-foreground" />
          <h2 className="mt-4 text-sm font-semibold">Activity graph</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Trace assignments, runs, comments, approvals, and decisions across the system.</p>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Obsidian vault</h2>
              <p className="mt-1 text-xs text-muted-foreground">Long-term notes and linked Markdown</p>
            </div>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${obsidian?.state === "online" ? "border-emerald-500/25 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 text-amber-700 dark:text-amber-300"}`}>
              {obsidian?.state ?? "unknown"}
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {obsidian?.detail ?? "The KaliOS2 status API has not returned an Obsidian health result yet."}
          </p>
          {obsidian?.publicUrl ? (
            <a href={obsidian.publicUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium underline-offset-4 hover:underline">
              Open KALI Brain
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="mt-4 text-[11px] text-muted-foreground">Set KALIOS2_OBSIDIAN_PUBLIC_URL to enable the browser link.</p>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Vector memory</h2>
              <p className="mt-1 text-xs text-muted-foreground">Qdrant retrieval foundation</p>
            </div>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${qdrant?.state === "online" ? "border-emerald-500/25 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 text-amber-700 dark:text-amber-300"}`}>
              {qdrant?.state ?? "unknown"}
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {qdrant?.detail ?? "The KaliOS2 status API has not returned a Qdrant health result yet."}
          </p>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Phase 1 exposes health and architecture boundaries. Automatic vector ingestion remains a Hermes responsibility.
          </p>
        </article>
      </section>
    </div>
  );
}
