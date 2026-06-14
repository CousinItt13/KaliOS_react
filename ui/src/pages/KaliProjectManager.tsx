import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, FolderKanban, Loader2, RotateCcw, Send, Sparkles, TriangleAlert } from "lucide-react";
import { kaliosApi, type KaliChatMessage } from "../api/kalios";
import { projectsApi } from "../api/projects";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";

const initialMessages: KaliChatMessage[] = [
  {
    role: "assistant",
    content:
      "I am Hermes, the KaliOS2 Phase 1 Project Manager interface. Select a project or speak at company level. I can help plan work, identify blockers, prioritize tasks, and coordinate workers. I will not claim that an action ran unless a connected tool confirms it.",
  },
];

const quickPrompts = [
  "Summarize the most important work and risks.",
  "Create a practical next-step plan.",
  "Which tasks should be prioritized first?",
  "What should the project manager verify before execution?",
];

export function KaliProjectManager() {
  const { selectedCompanyId, selectedCompany, companies } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [projectId, setProjectId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<KaliChatMessage[]>(initialMessages);

  useEffect(() => {
    setBreadcrumbs([{ label: "Project Manager" }]);
  }, [setBreadcrumbs]);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  const statusQuery = useQuery({
    queryKey: ["kalios2", "status"],
    queryFn: () => kaliosApi.status(),
    retry: false,
    refetchInterval: 15_000,
  });

  const hermesStatus = statusQuery.data?.services.find((service) => service.key === "hermes") ?? null;
  const selectedProject = useMemo(
    () => (projectsQuery.data ?? []).find((project) => project.id === projectId) ?? null,
    [projectId, projectsQuery.data],
  );

  const chatMutation = useMutation({
    mutationFn: (nextMessages: KaliChatMessage[]) =>
      kaliosApi.chat({
        projectId: projectId || undefined,
        messages: nextMessages,
      }),
    onSuccess: (response) => {
      setMessages((current) => [...current, response.message]);
    },
  });

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || chatMutation.isPending) return;
    const userMessage: KaliChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    chatMutation.mutate(nextMessages);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendMessage(draft);
  };

  if (!selectedCompanyId) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Project Manager</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {companies.length === 0 ? "Create a company before opening Hermes." : "Select a company before opening Hermes."}
        </p>
      </div>
    );
  }

  const hermesOnline = hermesStatus?.state === "online";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Hermes Project Manager</h1>
                <p className="text-xs text-muted-foreground">KaliOS2 Phase 1 · {selectedCompany?.name}</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Use Hermes for planning and coordination. Operational changes still flow through the existing project, task, worker, approval, and runtime screens.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex min-w-64 flex-col gap-1 text-xs font-medium text-muted-foreground">
              Project context
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Company level</option>
                {(projectsQuery.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setMessages(initialMessages);
                chatMutation.reset();
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New conversation
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              hermesOnline
                ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${hermesOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
            {hermesOnline ? "Hermes online" : hermesStatus ? `Hermes ${hermesStatus.state}` : "Checking Hermes"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
            <FolderKanban className="h-3 w-3" />
            {selectedProject?.name ?? "Company context"}
          </span>
        </div>
      </section>

      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {chatMutation.isPending ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Hermes is thinking…
              </div>
            </div>
          ) : null}

          {chatMutation.error ? (
            <div className="flex items-start gap-2 rounded-md border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{chatMutation.error.message}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={chatMutation.isPending}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="sr-only">Message Hermes</span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage(draft);
                  }
                }}
                rows={3}
                placeholder="Ask Hermes about plans, priorities, blockers, or worker coordination…"
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button
              type="submit"
              disabled={!draft.trim() || chatMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Enter sends. Shift+Enter adds a line. Hermes receives the selected project ID as context.
          </p>
        </div>
      </section>
    </div>
  );
}
