#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f package.json || ! -d ui || ! -d server ]]; then
  echo "Run this script from the root of a Paperclip fork." >&2
  exit 1
fi

mkdir -p docs ui/src/kalios .github/ISSUE_TEMPLATE

echo "KaliOS bootstrap files are present. Recommended next steps:"
echo "  1. git checkout -b feat/kalios-shell"
echo "  2. import ui/src/kalios/design-tokens.css from ui/src/index.css"
echo "  3. adapt Sidebar.tsx to use kaliPrimaryNavigation"
echo "  4. add placeholder routes for /runs, /knowledge, /connections, /runtime"
echo "  5. commit the bootstrap as: feat(kalios): add product shell foundation"
