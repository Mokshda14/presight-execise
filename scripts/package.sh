#!/usr/bin/env bash
# Builds the Docker image and saves it to deploy/presight-app-<date>.tar.gz.
# Starts nothing; use scripts/deploy.sh to run it.
#
#   ./scripts/package.sh
set -euo pipefail

# run from the repo root so docker compose finds its file
cd "$(cd "$(dirname "$0")/.." && pwd)"

IMAGE="presight-execise-app:latest"
OUT_DIR="deploy"
TARBALL="${OUT_DIR}/presight-app-$(date +%Y%m%d).tar.gz"

echo "==> Building ${IMAGE}"
docker compose build

mkdir -p "${OUT_DIR}"

echo "==> Saving to ${TARBALL}"
docker save "${IMAGE}" | gzip > "${TARBALL}"

SIZE="$(du -h "${TARBALL}" | cut -f1 | tr -d ' ')"
echo
echo "Done. Nothing is running yet."
echo "  Bundle: ${TARBALL} (${SIZE})"
echo
echo "Run it here:      ./scripts/deploy.sh"
echo "Run it elsewhere: copy ${TARBALL} and scripts/deploy.sh into one directory, then"
echo "                  ./deploy.sh $(basename "${TARBALL}") [port]"
