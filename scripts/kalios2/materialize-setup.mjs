#!/usr/bin/env node

import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const templateRoot = path.join(repoRoot, "setup", "templates");

async function installDirectory(sourceDir, relativeDir = "") {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name);
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      await installDirectory(source, relative);
      continue;
    }
    if (!entry.name.endsWith(".template")) continue;
    const destinationRelative = relative.slice(0, -".template".length);
    const destination = path.join(repoRoot, destinationRelative);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { force: true });
    console.log(`created ${destinationRelative}`);
  }
}

await installDirectory(templateRoot);
console.log("KaliOS2 setup scripts and HTML board are ready.");
console.log("Run SETUP-KALIOS2-AUTO.bat or SETUP-KALIOS2-MANUAL.bat.");
