#!/bin/sh
# Run Express backend and Next.js frontend in the same container.
# If either exits, kill the other and exit (busybox ash compatible).

cleanup() {
  echo "[start] Shutting down…"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 1
}
trap cleanup EXIT INT TERM

echo "[start] Starting Express backend on port 4000…"
cd /app/backend && node server.js &
BACKEND_PID=$!

echo "[start] Starting Next.js frontend on port 3000…"
cd /app && node server.js &
FRONTEND_PID=$!

# Wait for whichever finishes first
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
  sleep 1
done
echo "[start] One process exited."
