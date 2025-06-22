#!/bin/bash
# Launches both oracle-service and frontend from project root

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "oracle-service" ] || [ ! -d "frontend" ]; then
  echo "❌ Must run from project root with oracle-service/ and frontend/ directories."
  exit 1
fi

(cd oracle-service && npm start) &
sleep 3
cd frontend && npm run dev
