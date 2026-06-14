# KaliOS2 Phase 1 setup

Use `SETUP-KALIOS2-AUTO.bat` for automatic setup or `SETUP-KALIOS2-MANUAL.bat` for guided setup.

The setup validates Docker, prepares Hermes and React environment files, creates the shared `kalios2-net` network, starts the KaliOS2 core services and KaliOS React, runs checks, and opens `http://127.0.0.1:3100/kalios-setup.html`.

For an explicit core location:

```powershell
powershell -File .\scripts\kalios2\setup-auto.ps1 -KaliOS2Root "S:\AI\KaliOS2"
```

Daily operations:

```text
START-KALIOS2.bat
CHECK-KALIOS2.bat
STOP-KALIOS2.bat
OPEN-KALIOS2-SETUP-BOARD.bat
```

The board shows the current script, setup step, checks, containers, and live Hermes/Ollama/Open WebUI status. Sanitized status is written to `runtime\kalios2\setup-status.json`; credentials are never written to the board status.
