# KaliOS React + KaliOS2 Phase 1

This repository can run as the browser control plane for the three-service KaliOS2 Phase 1 stack:

- `kalios2-hermes`
- `kalios2-ollama`
- `kalios2-webui`

KaliOS React joins the existing external Docker network as `kalios2-react`. It does **not** receive the Docker socket. Browser requests terminate at the Paperclip server, which performs server-side health checks and proxies Project Manager chat to Hermes.

## Security boundary

```text
Browser -> KaliOS React server -> Hermes -> privileged runtime
```

The browser never receives:

- `KALIOS2_HERMES_TOKEN`
- cloud-provider keys
- Docker access
- private container URLs

Only board actors can use the KaliOS2 status and Hermes proxy routes.

## API endpoints

```text
GET  /api/health
GET  /api/health/kalios/status
POST /api/health/kalios/hermes/chat
```

The UI pages use these endpoints through same-origin requests with the current Paperclip session.

## Start with KaliOS2

1. Start the KaliOS2 Phase 1 stack first. It must create the external Docker network `kalios2-net`.
2. Copy `.env.example` to `.env` in this repository.
3. Set strong values for:

```env
BETTER_AUTH_SECRET=<long-random-secret>
KALIOS2_HERMES_TOKEN=<same value as HERMES_API_KEY in KaliOS2>
```

4. Build and start the React control plane:

```bash
docker compose -f docker-compose.kalios2.yml up -d --build
```

5. Open:

```text
http://127.0.0.1:3100
```

6. Verify the integration:

```bash
pnpm kalios2:doctor
```

The doctor exits with code `2` when the React server is healthy but Hermes is offline. Use `--allow-offline` when validating UI-only development.

## Phase 1 defaults

| Service | Internal URL | Browser URL |
|---|---|---|
| Hermes API | `http://kalios2-hermes:8642` | not exposed by the React UI |
| Hermes dashboard | server-side configuration only | `http://127.0.0.1:9119` |
| Ollama | `http://kalios2-ollama:11434` | `http://127.0.0.1:11434` |
| Open WebUI | `http://kalios2-webui:8080` | `http://127.0.0.1:3000` |
| KaliOS React | `http://kalios2-react:3100` | `http://127.0.0.1:3100` |

Qdrant and Obsidian are intentionally disabled by default because they are not part of the minimal KaliOS2 Phase 1 package. Configure `KALIOS2_QDRANT_URL` and `KALIOS2_OBSIDIAN_URL` when those services are introduced.

## UI integration

The fork already includes these KaliOS views:

- Dashboard and live overview
- Connections and service health
- Hermes Project Manager chat
- KALI Brain entry point
- Projects, tasks/issues, agents/workers, approvals, budgets and runtime views inherited from Paperclip

The Connections page refreshes status every 15 seconds. Project Manager chat sends only the selected project ID and conversation messages to the server-side proxy.

## Operational checks

```bash
# Container status
docker compose -f docker-compose.kalios2.yml ps

# React logs
docker compose -f docker-compose.kalios2.yml logs -f kalios-react

# API verification
pnpm kalios2:doctor
```

Do not mount `/var/run/docker.sock` into `kalios2-react`. Docker operations must remain behind Hermes.
