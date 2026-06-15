# KaliOS2 Phase 1 setup

## Prepare the setup commands

Run once after cloning:

```powershell
node .\scripts\kalios2\materialize-setup.mjs
```

## Automatic setup

```text
SETUP-KALIOS2-AUTO.bat
```

This verifies Docker, locates the KaliOS2 core repository, prepares configuration, creates the shared network, starts both stacks, runs checks, and opens the board.

## Guided manual setup

```text
SETUP-KALIOS2-MANUAL.bat
```

The manual flow pauses before Docker preflight, core detection, configuration, network creation, core startup, React startup, and verification.

## Daily operations

```text
START-KALIOS2.bat
CHECK-KALIOS2.bat
STOP-KALIOS2.bat
OPEN-KALIOS2-SETUP-BOARD.bat
```

## Board

Open `http://127.0.0.1:3100/kalios-setup.html`.

The Connections & Setup Board shows live services, the script currently running, setup progress, checks, containers, and commands. Sanitized status is written to `runtime\kalios2\setup-status.json` and mounted read-only into the React container.
