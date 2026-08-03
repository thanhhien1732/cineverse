#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
python3 scripts/https_server.py --host 0.0.0.0 --port 9999
