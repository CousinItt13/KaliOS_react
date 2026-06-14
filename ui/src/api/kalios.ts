export type KaliServiceState = "online" | "offline" | "disabled" | "managed";

export type KaliServiceStatus = {
  key: string;
  label: string;
  state: KaliServiceState;
  configured: boolean;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
  publicUrl: string | null;
};

export type KaliStatus = {
  product: "KaliOS2";
  phase: 1;
  mode: "local-first";
  checkedAt: string;
  services: KaliServiceStatus[];
  capabilities: {
    projects: boolean;
    tasks: boolean;
    workers: boolean;
    approvals: boolean;
    budgets: boolean;
    projectManager: boolean;
    knowledge: boolean;
    dockerMutations: boolean;
  };
};

export type KaliChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type KaliChatResponse = {
  id: string | null;
  model: string;
  message: { role: "assistant"; content: string };
  usage: unknown;
};

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as (T & { error?: string; message?: string }) | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `KaliOS2 request failed (${response.status})`);
  }
  if (!payload) throw new Error("KaliOS2 returned an empty response");
  return payload;
}

export const kaliosApi = {
  status: () => jsonRequest<KaliStatus>("/api/kalios/status"),
  chat: (input: { projectId?: string; model?: string; messages: KaliChatMessage[] }) =>
    jsonRequest<KaliChatResponse>("/api/kalios/hermes/chat", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
