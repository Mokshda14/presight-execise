#!/usr/bin/env bash
# Loads the app image and runs it. Needs only Docker.
#
#   ./scripts/deploy.sh [tarball] [port]
#
# With no tarball, picks the newest presight-app-*.tar.gz next to this script or
# in <repo>/deploy/. If there is none but the image is already present locally,
# the load is skipped. Port defaults to 3000.
#
# Self-contained: copy it next to a tarball on any machine and it works.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "${HERE}/.." && pwd)"

IMAGE="presight-execise-app:latest"
CONTAINER="presight-app"
VOLUME="presight-data"
PORT="${2:-3000}"

if [ -n "${1:-}" ]; then
  TARBALL="$1"
  # a missing explicit path is a typo, not a reason to fall back to a cached
  # image, which would quietly deploy a different build
  if [ ! -f "${TARBALL}" ]; then
    echo "error: tarball not found: ${TARBALL}" >&2
    exit 1
  fi
else
  # plain loop rather than `ls | head`: an unmatched glob stays literal, and the
  # resulting ls failure would trip pipefail. also avoids empty-array expansion,
  # which errors under `set -u` in bash 3.2.
  TARBALL=""
  for candidate in "${HERE}"/presight-app-*.tar.gz "${ROOT}"/deploy/presight-app-*.tar.gz; do
    [ -f "${candidate}" ] || continue
    if [ -z "${TARBALL}" ] || [ "${candidate}" -nt "${TARBALL}" ]; then
      TARBALL="${candidate}"
    fi
  done
fi

if [ -n "${TARBALL}" ] && [ -f "${TARBALL}" ]; then
  echo "==> Loading image from ${TARBALL}"
  gunzip -c "${TARBALL}" | docker load
elif docker image inspect "${IMAGE}" > /dev/null 2>&1; then
  echo "==> No tarball found, using the local ${IMAGE}"
else
  echo "error: no presight-app-*.tar.gz found and no local ${IMAGE}." >&2
  echo "       Run ./scripts/package.sh first, or pass a tarball explicitly." >&2
  exit 1
fi

# checked before the old container is removed, so a busy port can't leave us
# with nothing running. our own container holding it is fine.
if lsof -ti:"${PORT}" > /dev/null 2>&1; then
  OURS="$(docker ps --filter "name=^${CONTAINER}$" --format '{{.Ports}}' | grep -c ":${PORT}->" || true)"
  if [ "${OURS}" = "0" ]; then
    echo "error: port ${PORT} is already in use by another process." >&2
    echo "       Free it, or pick another port:  $0 '' 3001" >&2
    exit 1
  fi
fi

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  echo "==> Replacing ${CONTAINER}"
  docker rm -f "${CONTAINER}" > /dev/null
fi

echo "==> Starting ${CONTAINER} on port ${PORT}"
docker run -d \
  --name "${CONTAINER}" \
  --restart unless-stopped \
  -p "${PORT}:3000" \
  -v "${VOLUME}:/data" \
  "${IMAGE}" > /dev/null

echo "==> Waiting for the app"
for _ in $(seq 1 30); do
  if curl -sf "http://localhost:${PORT}/api/users?limit=1" > /dev/null 2>&1; then
    echo
    echo "Up: http://localhost:${PORT}"
    echo "  API docs:  http://localhost:${PORT}/api/docs"
    echo "  Logs:      docker logs -f ${CONTAINER}"
    echo "  Stop:      docker rm -f ${CONTAINER}"
    echo "  Reset DB:  docker rm -f ${CONTAINER} && docker volume rm ${VOLUME}"
    exit 0
  fi
  sleep 1
done

echo "error: app did not respond within 30s; check: docker logs ${CONTAINER}" >&2
exit 1
