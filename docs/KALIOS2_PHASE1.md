# KaliOS2 Phase 1

KaliOS2 Phase 1 is a local-first Agentic OS control plane built on the Paperclip fork.

## Included

- companies, projects, goals, tasks, dependencies, comments, and artifacts
- worker creation, assignment, heartbeats, runs, logs, permissions, and budgets
- approvals, costs, routines, skills, activity, and audit history
- KaliOS2 Overview and Control Plane navigation
- server-side health probes for Hermes, Ollama, Qdrant, KALI Brain, Open WebUI, and Docker through Hermes
- server-side Hermes chat proxy
- project-scoped Hermes Project Manager
- Connections health page
- KALI Brain workspace
- command-line doctor check

Paperclip remains the operational system of record. Hermes remains the privileged boundary for model routing, credentials, Docker control, graph memory, and long-term knowledge writes.

## Security model

```text
Browser -> KaliOS2 API -> Hermes -> Docker, models, credentials, workers, Obsidian
```

The browser never receives the Hermes token, provider keys, or Docker socket access.

## Requirements

- Node.js 20+
- pnpm 9.15+
- Hermes for Project Manager chat
- optional Ollama, Qdrant, Obsidian, and Open WebUI

Paperclip can use its embedded PostgreSQL database for the first run.

## Start

```bash
git clone https://github.com/CousinItt13/KaliOS_react.git
cd KaliOS_react
git checkout feat/kalios2-phase1
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3100` and complete the standard onboarding flow.

Copy the required values from `.env.kalios2.phase1.example` into the environment used to start the server.

## Existing KALI Docker stack

Inside `kali-os_kali-net`, use service names:

```text
KALIOS2_HERMES_URL=http://kali-hermes:8000
KALIOS2_OLLAMA_URL=http://kali-ollama:11434
KALIOS2_QDRANT_URL=http://kali-qdrant:6333
KALIOS2_OBSIDIAN_URL=http://kali-obsidian:3000
KALIOS2_OPENWEBUI_URL=http://kali-open-webui:8080
```

When the server runs directly on the host, use the published localhost ports shown in the environment example.

Set `KALIOS2_HERMES_TOKEN` or reuse `KALI_INTERNAL_TOKEN` in the server environment. Do not expose it through browser variables.

## Phase 1 routes

| Page | Route |
|---|---|
| Overview | `/dashboard` |
| Control Plane | `/dashboard/live` |
| Project Manager | `/project-manager` |
| Connections | `/connections` |
| KALI Brain | `/knowledge` |
| Runtime | `/runtime` |
| Projects | `/projects` |
| Tasks | `/issues` |
| Workers | `/agents/all` |

The existing router automatically prefixes these routes with the selected company.

## APIs

`GET /api/kalios/status` returns safe service health metadata. It never returns credentials or internal tokens.

`POST /api/kalios/hermes/chat` forwards a validated, project-scoped chat request to Hermes at `/v1/chat/completions`.

Service states:

- `online`: successful health response
- `offline`: configured but unreachable or unhealthy
- `disabled`: disabled by configuration
- `managed`: indirect boundary such as Docker through Hermes

## Verify

```bash
pnpm kalios2:doctor
pnpm typecheck
pnpm test
pnpm build
```

Optional integrations may be offline during development:

```bash
pnpm kalios2:doctor -- --allow-offline
```

## Acceptance criteria

- The application starts without requiring optional external services.
- Existing Paperclip project, task, worker, approval, budget, routine, and artifact features continue working.
- Service failures appear as offline and do not crash the UI.
- Hermes chat works when its server URL and token are valid.
- Privileged tokens remain server-side.
- Docker authority remains behind Hermes.
- Public service links are opt-in.

## Phase 2

Phase 2 adds Docker lifecycle controls, project team allocation, drag-and-drop assignment, structured Hermes action proposals, automatic knowledge writes, vector retrieval controls, and richer pipeline views.
