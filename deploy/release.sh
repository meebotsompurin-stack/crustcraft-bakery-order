#!/usr/bin/env bash
set -euo pipefail

# CrustCraft Automated Release & Rollback Script (Episodes 7 & 8)
# Resolves a 40-char commit SHA image tag to an immutable @sha256 digest,
# executes the migration job (unless ROLLBACK=true), and updates Cloud Run.

PROJECT_ID="${PROJECT_ID:?ERROR: PROJECT_ID is required}"
REGION="${REGION:-asia-southeast1}"
REPO_NAME="${REPO_NAME:-crustcraft}"
SERVICE_NAME="${SERVICE_NAME:-crustcraft}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-crustcraft-migrate}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse HEAD 2>/dev/null || echo "")}"
IMAGE_TAG="${IMAGE_TAG:?ERROR: IMAGE_TAG is required}"
ROLLBACK="${ROLLBACK:-false}"

if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: Image tag must be a full 40-character commit SHA (got: '$IMAGE_TAG')." >&2
  exit 1
fi

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"

echo "Resolving immutable digest for ${IMAGE} ..."
DEPLOYED_IMAGE=$(gcloud artifacts docker images describe "$IMAGE" \
  --project="$PROJECT_ID" \
  --format='value(image_summary.digest)' | awk '{print "'$REGION'-docker.pkg.dev/'$PROJECT_ID'/'$REPO_NAME'/'$SERVICE_NAME'@" $1}')

if [[ -z "$DEPLOYED_IMAGE" || ! "$DEPLOYED_IMAGE" =~ @sha256:[0-9a-f]{64}$ ]]; then
  echo "ERROR: Image digest not found or invalid for ${IMAGE} (got: '${DEPLOYED_IMAGE:-empty}')." >&2
  exit 1
fi

echo "Resolved immutable image: ${DEPLOYED_IMAGE}"

if [[ "$ROLLBACK" == "true" ]]; then
  echo "Rollback mode enabled (ROLLBACK=true): skipping database migration job."
else
  echo "Updating and executing Cloud Run migration job ${MIGRATE_JOB_NAME} ..."
  gcloud run jobs update "$MIGRATE_JOB_NAME" \
    --image="$DEPLOYED_IMAGE" \
    --region="$REGION" \
    --project="$PROJECT_ID"

  gcloud run jobs execute "$MIGRATE_JOB_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --wait
fi

echo "Updating Cloud Run service ${SERVICE_NAME} to ${DEPLOYED_IMAGE} ..."
gcloud run services update "$SERVICE_NAME" \
  --image="$DEPLOYED_IMAGE" \
  --region="$REGION" \
  --project="$PROJECT_ID"

gcloud run services update-traffic "$SERVICE_NAME" \
  --region="$REGION" \
  --to-latest \
  --project="$PROJECT_ID"

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format='value(status.url)')"

if [[ -z "$SERVICE_URL" ]]; then
  echo "ERROR: Failed to retrieve SERVICE_URL for ${SERVICE_NAME}." >&2
  exit 1
fi

if [[ -n "${GITHUB_ENV:-}" ]]; then
  {
    echo "DEPLOYED_IMAGE=${DEPLOYED_IMAGE}"
    echo "SERVICE_URL=${SERVICE_URL}"
  } >> "$GITHUB_ENV"
fi

echo "Release complete: ${SERVICE_URL} serving ${DEPLOYED_IMAGE}"
