import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kaliosRoutes } from "./kalios.js";

function testApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as typeof req & { actor: { type: "board" } }).actor = { type: "board" };
    next();
  });
  app.use("/api", kaliosRoutes());
  return app;
}

describe("KaliOS2 Phase 1 routes", () => {
  beforeEach(() => {
    process.env.KALIOS2_HERMES_URL = "http://hermes.internal:8000";
    process.env.KALIOS2_HERMES_TOKEN = "server-only-secret";
    process.env.KALIOS2_HERMES_MODEL = "test-model";
    delete process.env.KALIOS2_HERMES_PUBLIC_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.KALIOS2_HERMES_URL;
    delete process.env.KALIOS2_HERMES_TOKEN;
    delete process.env.KALIOS2_HERMES_MODEL;
    delete process.env.KALIOS2_HERMES_PUBLIC_URL;
  });

  it("reports service health without exposing internal URLs or tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })),
    );

    const response = await request(testApp()).get("/api/kalios/status").expect(200);

    expect(response.body.product).toBe("KaliOS2");
    expect(response.body.phase).toBe(1);
    expect(response.body.services.some((service: { key: string; state: string }) => service.key === "hermes" && service.state === "online")).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain("server-only-secret");
    expect(JSON.stringify(response.body)).not.toContain("hermes.internal");
  });

  it("forwards validated chat to Hermes and returns the assistant message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chat-1",
          model: "test-model",
          choices: [{ message: { role: "assistant", content: "Plan confirmed." } }],
          usage: { total_tokens: 12 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await request(testApp())
      .post("/api/kalios/hermes/chat")
      .send({ projectId: "project-1", messages: [{ role: "user", content: "Plan the work." }] })
      .expect(200);

    expect(response.body.message).toEqual({ role: "assistant", content: "Plan confirmed." });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://hermes.internal:8000/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer server-only-secret" }),
      }),
    );
  });

  it("rejects invalid chat payloads before contacting Hermes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await request(testApp()).post("/api/kalios/hermes/chat").send({ messages: [] }).expect(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
