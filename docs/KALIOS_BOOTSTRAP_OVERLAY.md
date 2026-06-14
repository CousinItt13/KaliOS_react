# KaliOS_react Bootstrap Overlay

This overlay is designed for a fork of `paperclipai/paperclip` named:

- Owner: `CousinItt13`
- Repository: `KaliOS_react`
- Upstream default branch: `master`

## Purpose

KaliOS_react keeps Paperclip's proven React/Node/PostgreSQL control-plane architecture and reshapes the product into a local-first Agentic OS dashboard for:

- Hermes orchestration
- projects and project teams
- workers and worker runtimes
- tasks, runs, artifacts, budgets, approvals, and logs
- Docker runtime visibility
- Obsidian/KALI Brain knowledge access
- drag-and-drop assignment of tasks and workers
- project-manager conversations with structured actions

## Apply this overlay

1. Fork `paperclipai/paperclip` to `CousinItt13/KaliOS_react`.
2. Clone the fork.
3. Copy this overlay into the repository root.
4. Run `bash scripts/apply-kalios-bootstrap.sh`.
5. Review the generated branch and commit.

The script only adds KaliOS-specific files. It does not overwrite Paperclip source files.

## First implementation branch

Recommended branch name:

```text
feat/kalios-shell
```

## Source compatibility

This plan assumes Paperclip's current structure:

```text
ui/
server/
packages/
docker/
docs/
```

The existing UI already contains React, Vite, React Router, TanStack Query, dnd-kit, Radix UI, Tailwind, command-palette patterns, a three-pane layout, project pages, agent pages, issue/task pages, approvals, artifacts, costs, activity, and adapters. KaliOS should extend those boundaries instead of replacing them.
