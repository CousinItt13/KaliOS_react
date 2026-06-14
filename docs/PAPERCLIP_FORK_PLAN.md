# Paperclip to KaliOS Fork Plan

## Principle

Do not rewrite Paperclip. Preserve its domain services, database migrations, adapters, authentication, plugins, issue model, approvals, costs, artifacts, and event infrastructure. Introduce KaliOS as a product shell and integration layer.

## Existing Paperclip areas to reuse

| Paperclip area | KaliOS use |
|---|---|
| Companies | Companies, workspaces, or top-level organizations |
| Projects | Primary delivery containers |
| Agents | Workers |
| Issues | Tasks |
| Goals | Objectives and project goal lineage |
| Artifacts | Worker outputs and generated files |
| Approvals | Human governance |
| Costs | Token, provider, and runtime budgets |
| Activity | Audit and operational event feed |
| Adapters | Hermes and other runtime connectors |
| Plugins | Optional features and third-party integration |
| Workspaces | Execution and runtime workspaces |

## Naming strategy

Avoid immediate database renames. Start with a UI vocabulary layer:

```text
Agent   -> Worker
Issue   -> Task
Company -> Organization or Company
Board   -> Workspace
```

Keep original API and database names until a later migration proves necessary. This reduces upstream merge conflicts.

## New KaliOS modules

### UI

```text
ui/src/kalios/
  navigation.ts
  product-language.ts
  runtime-status.ts
  design-tokens.css
  components/
  pages/
```

### Server

```text
server/src/kalios/
  hermes/
  docker/
  knowledge/
  projects/
  health/
```

### Packages

```text
packages/kalios-contracts/
packages/adapter-hermes/
packages/adapter-obsidian/
packages/docker-gateway-client/
```

## Hermes integration

Hermes is the privileged orchestration boundary. KaliOS talks to Hermes through a dedicated adapter and API client.

Responsibilities owned by Hermes:

- model routing
- encrypted provider secrets
- Docker lifecycle
- project worker lifecycle
- pipeline dispatch
- graph memory
- long-term Obsidian writes

The browser must never receive Docker socket access or decrypted provider credentials.

## Docker integration

Add a restricted Docker gateway or route all mutations through Hermes. The UI reads normalized health objects rather than raw Docker API responses.

```ts
export interface RuntimeResource {
  id: string;
  kind: "container" | "volume" | "network" | "service";
  name: string;
  projectId?: string;
  workerId?: string;
  state: "healthy" | "running" | "stopped" | "failed" | "unknown";
  details?: Record<string, unknown>;
}
```

## Knowledge integration

PostgreSQL remains the operational system of record. Obsidian and KALI Brain remain the human-readable long-term knowledge layer.

KaliOS knowledge pages show:

- project notes
- decisions
- reports
- memory graph entries
- linked artifacts
- sync status

## Delivery phases

### Phase 1 — KaliOS shell

- branding and design tokens
- new navigation
- overview dashboard
- vocabulary layer: agents to workers, issues to tasks
- project-centric landing pages
- runtime health cards

### Phase 2 — Operations

- drag-and-drop worker and task assignment
- worker overview per project
- run detail and logs
- Hermes health and pipeline status
- Docker resource pages
- connections manager

### Phase 3 — Intelligence

- Project Manager chat
- structured action proposals
- KALI Brain search
- graph memory visualization
- automatic task decomposition
- project team routing

### Phase 4 — Governance

- role-based permissions
- budget policy
- approval policy
- audit exports
- secrets rotation workflows
- backup and restore status

## Upstream maintenance

Configure remotes:

```bash
git remote rename origin fork
git remote add upstream https://github.com/paperclipai/paperclip.git
git fetch upstream
```

Recommended merge policy:

- `master`: tracks upstream plus reviewed KaliOS changes
- feature branches: KaliOS implementation
- one upstream-sync PR per release window
- avoid mass formatting and broad file moves
- isolate branding and terminology behind configuration wherever possible
