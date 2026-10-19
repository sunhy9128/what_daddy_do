#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -z "${EXPO_TOKEN:-}" ] && [ -f "$DIR/.env.local" ]; then
  set -a
  source "$DIR/.env.local"
  set +a
fi
: "${EXPO_TOKEN:?请在 what-dad-do-vibe/.env.local 中设置 EXPO_TOKEN}"
cd "$DIR"
npx eas build -p android --profile preview --clear-cache --non-interactive
