#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CRITICAL WARNING (Lab 5 Policy B1):
# Keep Cloud Run and Cloud SQL running continuously until grading has ended and
# Lab 6 partner UAT is complete. Pausing or tearing down during this period is
# strictly prohibited! Do NOT run this script before official instructor clearance.
# ==============================================================================

PROJECT_ID="${PROJECT_ID:?ERROR: PROJECT_ID environment variable is required}"
REGION="${REGION:-asia-southeast1}"
DRY_RUN="${DRY_RUN:-0}"

REPO_NAME="${REPO_NAME:-crustcraft}"
SQL_INSTANCE="${SQL_INSTANCE:-crustcraft-pg}"
SERVICE_NAME="${SERVICE_NAME:-crustcraft}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-crustcraft-migrate}"
SA_NAME="${SA_NAME:-crustcraft-runner}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

SECRETS=(
  "crustcraft-database-url"
  "crustcraft-jwt-secret"
  "crustcraft-admin-password"
  "crustcraft-demo-password"
)

run_cmd() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY_RUN] $*"
  else
    echo "+ $*"
    "$@" || echo "Warning: command failed or resource already deleted: $*" >&2
  fi
}

if [[ "$DRY_RUN" != "1" ]]; then
  echo "WARNING: This will permanently delete CrustCraft Cloud Run, Cloud SQL (${SQL_INSTANCE}),"
  echo "Artifact Registry (${REPO_NAME}), Secrets, and Service Account in project '${PROJECT_ID}'."
  read -r -p "Type the exact PROJECT_ID (${PROJECT_ID}) to confirm teardown: " CONFIRM
  if [[ "$CONFIRM" != "$PROJECT_ID" ]]; then
    echo "Aborted: confirmation did not match ${PROJECT_ID}." >&2
    exit 1
  fi
fi

run_cmd gcloud run services delete "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --quiet
run_cmd gcloud run jobs delete "$MIGRATE_JOB_NAME" --region="$REGION" --project="$PROJECT_ID" --quiet
run_cmd gcloud sql instances delete "$SQL_INSTANCE" --project="$PROJECT_ID" --quiet
run_cmd gcloud artifacts repositories delete "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" --quiet

for secret in "${SECRETS[@]}"; do
  run_cmd gcloud secrets delete "$secret" --project="$PROJECT_ID" --quiet
done

run_cmd gcloud iam service-accounts delete "$SA_EMAIL" --project="$PROJECT_ID" --quiet

echo "Teardown completed."
