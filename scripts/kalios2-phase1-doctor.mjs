#!/usr/bin/env node

const baseUrl = (process.env.KALIOS2_BASE_URL || "http://127.0.0.1:3100").replace(/\/$/, "");
const cookie = process.env.KALIOS2_COOKIE?.trim();
const allowOffline = process.argv.includes("--allow-offline");

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    signal: AbortSignal.timeout(8_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function line(label, value) {
  process.stdout.write(`${label.padEnd(24)} ${value}\n`);
}

try {
  const core = await request("/api/health");
  const phase = await request("/api/kalios/status");

  console.log("KaliOS2 Phase 1 doctor\n");
  line("Application", `${core.status}${core.version ? ` v${core.version}` : ""}`);
  line("Deployment", `${core.deploymentMode ?? "unknown"} / ${core.deploymentExposure ?? "unknown"}`);
  line("Product", `${phase.product} phase ${phase.phase} (${phase.mode})`);
  console.log("");

  for (const service of phase.services) {
    const latency = service.latencyMs === null ? "" : `, ${service.latencyMs} ms`;
    line(service.label, `${service.state}${latency} — ${service.detail}`);
  }

  const hermes = phase.services.find((service) => service.key === "hermes");
  if (!allowOffline && hermes?.state !== "online") {
    console.error("\nHermes is not online. Set KALIOS2_HERMES_URL and KALIOS2_HERMES_TOKEN, or rerun with --allow-offline.");
    process.exitCode = 2;
  } else {
    console.log("\nPhase 1 API checks completed.");
  }
} catch (error) {
  console.error(`KaliOS2 doctor failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
