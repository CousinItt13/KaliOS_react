export type KaliWorkerStatus = "offline" | "idle" | "queued" | "running" | "waiting" | "paused" | "failed";

export type KaliTaskStatus = "backlog" | "ready" | "assigned" | "running" | "review" | "blocked" | "done" | "cancelled";

export type KaliRunStatus = "queued" | "starting" | "active" | "waiting_input" | "succeeded" | "failed" | "cancelled";
