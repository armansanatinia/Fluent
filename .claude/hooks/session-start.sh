#!/bin/bash
# Cloud sessions only: install the app's tooling and create its local D1
# tables, so `npm run dev` and `npm test` work the moment the session opens.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund

# schema.sql only uses CREATE ... IF NOT EXISTS, so this is safe to rerun.
npm run db:local

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export WRANGLER_SEND_METRICS=false' >> "$CLAUDE_ENV_FILE"
fi
