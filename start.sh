#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$project_dir/.env" ]] || { echo 'Missing .env; copy .env.example and provide real secrets.' >&2; exit 1; }
[[ -d "$project_dir/server/node_modules" && -d "$project_dir/client/node_modules" ]] || { echo 'Dependencies are missing; install them explicitly before starting.' >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a
(cd "$project_dir/server" && BACKEND_PORT="${BACKEND_PORT:-4000}" npm start) & backend_pid=$!
(cd "$project_dir/client" && npm run dev -- --host 127.0.0.1 --port "${FRONTEND_PORT:-3000}") & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
wait "$backend_pid" "$frontend_pid"
