import { Router, type Request } from "express";
import { z } from "zod";
import { forbidden } from "../errors.js";
import { logger } from "../middleware/logger.js";

const DEFAULT_TIMEOUT_MS = 4_000;

const chatRequestSchema = z.object({
  projectId: z.string().trim().min(1).max(200).optional(),
  model: z.string().trim().min(1).max(200).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().trim().min(1).max(40_000),
      }),
    )
    .min(1)
    .max(60),
});

type ServiceState = "online" | "offline" | "disabled" | "managed";

type ServiceStatus = {
  key: string;
  label: string;
  state: ServiceState;
  configured: boolean;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
  publicUrl: string | null;
};

type ServiceDefinition = {
  key: string;
  label: string;
  baseUrl: string | null;
  publicUrl: string | null;
  healthPath: string;
  authorization?: string | null;
};

function envUrl(name: string, fallback?: string): string | null {
  const raw = process.env[name]?.trim() || fallback?.trim() || "";
  if (!raw || raw.toLowerCase() === "off" || raw.toLowerCase() === "disabled") return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function envPath(name: string, fallback: string): string {
  const raw = process.env[name]?.trim() || fallback;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function timeoutMs(): number {
  const parsed = Number(process.env.KALIOS2_PROBE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.trunc(parsed), 500), 15_000);
}

function assertBoard(req: Request) {
  if (req.actor.type !== "board") {
    throw forbidden("KaliOS2 board access required");
  }
}

function serviceDefinitions(): ServiceDefinition[] {
  const hermesToken = process.env.KALIOS2_HERMES_TOKEN?.trim() || process.env.KALI_INTERNAL_TOKEN?.trim() || null;
  return [
    {
      key: "hermes",
      label: "Hermes",
      baseUrl: envUrl("KALIOS2_HERMES_URL", "http://kali-hermes:8000"),
      publicUrl: envUrl("KALIOS2_HERMES_PUBLIC_URL"),
      healthPath: envPath("KALIOS2_HERMES_HEALTH_PATH", "/health"),
      authorization: hermesToken ? `Bearer ${hermesToken}` : null,
    },
    {
      key: "ollama",
      label: "Ollama",
      baseUrl: envUrl("KALIOS2_OLLAMA_URL", "http://kali-ollama:11434"),
      publicUrl: envUrl("KALIOS2_OLLAMA_PUBLIC_URL"),
      healthPath: envPath("KALIOS2_OLLAMA_HEALTH_PATH", "/api/tags"),
    },
    {
      key: "qdrant",
      label: "Qdrant",
      baseUrl: envUrl("KALIOS2_QDRANT_URL", "http://kali-qdrant:6333"),
      publicUrl: envUrl("KALIOS2_QDRANT_PUBLIC_URL"),
      healthPath: envPath("KALIOS2_QDRANT_HEALTH_PATH", "/readyz"),
    },
    {
      key: "obsidian",
      label: "KALI Brain",
      baseUrl: envUrl("KALIOS2_OBSIDIAN_URL", "http://kali-obsidian:3000"),
      publicUrl: envUrl("KALIOS2_OBSIDIAN_PUBLIC_URL"),
      healthPath: envPath("KALIOS2_OBSIDIAN_HEALTH_PATH", "/"),
    },
    {
      key: "open-webui",
      label: "Open WebUI",
      baseUrl: envUrl("KALIOS2_OPENWEBUI_URL", "http://kali-open-webui:8080"),
      publicUrl: envUrl("KALIOS2_OPENWEBUI_PUBLIC_URL"),
      healthPath: envPath("KALIOS2_OPENWEBUI_HEALTH_PATH", "/health"),
    },
  ];
}

async function probeService(definition: ServiceDefinition): Promise<ServiceStatus> {
  const checkedAt = new Date().toISOString();
  if (!definition.baseUrl) {
    return {
      key: definition.key,
      label: definition.label,
      state: "disabled",
      configured: false,
      latencyMs: null,
      checkedAt,
      detail: "Disabled by configuration",
      publicUrl: definition.publicUrl,
    };
  }

  const startedAt = Date.now();
  try {
    const headers: Record<string, string> = { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" };
    if (definition.authorization) headers.Authorization = definition.authorization;
    const response = await fetch(`${definition.baseUrl}${definition.healthPath}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(timeoutMs()),
    });
    const latencyMs = Date.now() - startedAt;
    return {
      key: definition.key,
      label: definition.label,
      state: response.ok ? "online" : "offline",
      configured: true,
      latencyMs,
      checkedAt,
      detail: response.ok ? `HTTP ${response.status}` : `Health probe returned HTTP ${response.status}`,
      publicUrl: definition.publicUrl,
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const detail = error instanceof Error ? error.message : "Unknown probe failure";
    return {
      key: definition.key,
      label: definition.label,
      state: "offline",
      configured: true,
      latencyMs,
      checkedAt,
      detail,
      publicUrl: definition.publicUrl,
    };
  }
}

export function kaliosRoutes() {
  const router = Router();

  router.get("/kalios/status", async (req, res) => {
    assertBoard(req);
    const services = await Promise.all(serviceDefinitions().map(probeService));
    const hermes = services.find((service) => service.key === "hermes");
    services.push({
      key: "docker",
      label: "Docker runtime",
      state: hermes?.state === "online" ? "managed" : "offline",
      configured: Boolean(hermes?.configured),
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      detail: hermes?.state === "online" ? "Managed through Hermes" : "Hermes must be online for Docker operations",
      publicUrl: null,
    });

    res.json({
      product: "KaliOS2",
      phase: 1,
      mode: "local-first",
      checkedAt: new Date().toISOString(),
      services,
      capabilities: {
        projects: true,
        tasks: true,
        workers: true,
        approvals: true,
        budgets: true,
        projectManager: Boolean(envUrl("KALIOS2_HERMES_URL", "http://kali-hermes:8000")),
        knowledge: Boolean(envUrl("KALIOS2_OBSIDIAN_URL", "http://kali-obsidian:3000")),
        dockerMutations: hermes?.state === "online",
      },
    });
  });

  router.post("/kalios/hermes/chat", async (req, res) => {
    assertBoard(req);
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      return;
    }

    const hermesUrl = envUrl("KALIOS2_HERMES_URL", "http://kali-hermes:8000");
    if (!hermesUrl) {
      res.status(503).json({ error: "hermes_disabled" });
      return;
    }

    const token = process.env.KALIOS2_HERMES_TOKEN?.trim() || process.env.KALI_INTERNAL_TOKEN?.trim() || "";
    const model = parsed.data.model || process.env.KALIOS2_HERMES_MODEL?.trim() || "hermes";
    const systemMessage = {
      role: "system" as const,
      content: [
        "You are Hermes, the Project Manager and privileged orchestration interface for KaliOS2 Phase 1.",
        "Help the operator plan, prioritize, explain blockers, and coordinate projects, tasks, and workers.",
        "Never claim that an action was executed unless the connected tool or runtime confirms it.",
        parsed.data.projectId ? `Current Paperclip project id: ${parsed.data.projectId}.` : "No project is currently selected.",
      ].join(" "),
    };

    try {
      const response = await fetch(`${hermesUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(Math.max(timeoutMs(), 60_000)),
        body: JSON.stringify({
          model,
          messages: [systemMessage, ...parsed.data.messages],
          stream: false,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            id?: string;
            model?: string;
            choices?: Array<{ message?: { role?: string; content?: string } }>;
            usage?: unknown;
            error?: unknown;
          }
        | null;

      if (!response.ok) {
        logger.warn({ status: response.status, payload }, "Hermes chat request failed");
        res.status(502).json({ error: "hermes_request_failed", status: response.status });
        return;
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        res.status(502).json({ error: "hermes_invalid_response" });
        return;
      }

      res.json({
        id: payload?.id ?? null,
        model: payload?.model ?? model,
        message: { role: "assistant", content },
        usage: payload?.usage ?? null,
      });
    } catch (error) {
      logger.warn({ err: error }, "Hermes chat request failed");
      res.status(503).json({
        error: "hermes_unreachable",
        message: error instanceof Error ? error.message : "Hermes is unreachable",
      });
    }
  });

  return router;
}
