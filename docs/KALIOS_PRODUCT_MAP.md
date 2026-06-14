# KaliOS Product Map

## Product positioning

KaliOS is a local-first Agentic Operating System control plane. Paperclip supplies the company, agent, task, governance, and adapter foundation. KaliOS adds a project-centric operating model, Hermes as the privileged orchestration boundary, Docker runtime visibility, and KALI Brain knowledge integration.

## Primary navigation

1. Overview
2. Projects
3. Tasks
4. Workers
5. Teams
6. Runs
7. Knowledge
8. Connections
9. Runtime
10. Approvals
11. Activity
12. Settings

## Global shell

### Left navigation rail

- KaliOS logo and environment status
- global overview
- projects
- tasks
- workers
- teams
- runs
- KALI Brain
- connections
- runtime
- approvals
- activity
- system settings

### Top bar

- project/company switcher
- global search
- command palette
- create menu
- running jobs indicator
- alerts and approvals
- user/environment menu

### Main workspace

The center pane hosts dashboards, boards, tables, chat, graphs, and configuration pages.

### Context inspector

The right pane shows the selected task, worker, project, run, artifact, or connection without forcing navigation away from the current view.

## Overview dashboard

The first screen answers four questions:

1. What is running?
2. What is blocked?
3. What needs approval?
4. Is the local infrastructure healthy?

Recommended cards:

- active runs
- blocked tasks
- pending approvals
- worker availability
- project health
- Hermes health
- Docker container health
- provider/model status
- token and cost usage
- latest artifacts
- latest KALI Brain updates

## Project workspace

Tabs:

```text
Overview | Board | Tasks | Team | Runs | Chat | Knowledge | Artifacts | Budget | Settings
```

### Project overview

- objective and current phase
- progress and risks
- team and project manager
- tasks by state
- current runs
- dependencies and blockers
- recent decisions
- budget and token use
- linked Obsidian notes

### Project board

Columns:

```text
Backlog | Ready | Assigned | Running | Review | Blocked | Done
```

Interactions:

- drag task between states
- drag worker onto task
- drag task onto worker rail
- drag task to team
- multi-select tasks
- keyboard movement alternative
- undo after mutations

### Project team

- workers grouped by role
- runtime and model badges
- allocation percentage
- current assignment
- queue depth
- cost and success rate
- drag worker into or out of project

## Worker workspace

Tabs:

```text
Overview | Tasks | Runs | Skills | Memory | Projects | Runtime | Logs | Permissions
```

Worker state model:

```text
offline | idle | queued | running | waiting | paused | failed
```

Worker runtime types:

- Hermes
- Paperclip adapter
- Claude, Codex, or Gemini local adapter
- HTTP/MCP worker
- custom container worker

## Task workspace

Task detail includes:

- title and description
- project and goal lineage
- status, priority, and deadline
- worker or team assignment
- capabilities required
- acceptance criteria
- dependencies
- comments and chat
- run history
- artifacts
- cost
- approval state
- immutable activity history

A task and a run remain separate entities. One task can have multiple attempts.

## Project Manager chat

The Project Manager is a project-scoped agent role. It receives project goals, task graph, team membership, recent decisions, knowledge links, costs, and blockers.

Actions appear as structured proposals:

```text
Create subtasks
Assign workers
Reprioritize work
Pause work
Request budget
Escalate blocker
Update project plan
```

Side effects require an explicit approval step according to policy.
