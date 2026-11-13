#!/usr/bin/env bash
set -euo pipefail

# Offline verification of deploy/deploy.sh and deploy/teardown.sh in DRY_RUN=1 mode

DEPLOY_OUT="$(DRY_RUN=1 PROJECT_ID="cpe334-crustcraft" REGION="asia-southeast1" bash deploy/deploy.sh --demo)"

assert_contains() {
  local haystack="$1"
  local needle="$2"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "ASSERTION FAILED: Expected output to contain: $needle" >&2
    exit 1
  fi
}

assert_contains "$DEPLOY_OUT" "--database-version=POSTGRES_16"
assert_contains "$DEPLOY_OUT" "--edition=enterprise"
assert_contains "$DEPLOY_OUT" "--tier=db-f1-micro"
assert_contains "$DEPLOY_OUT" "--no-storage-auto-increase"
assert_contains "$DEPLOY_OUT" "crustcraft-pg"
assert_contains "$DEPLOY_OUT" "crustcraft-migrate"
assert_contains "$DEPLOY_OUT" "crustcraft-runner@cpe334-crustcraft.iam.gserviceaccount.com"
assert_contains "$DEPLOY_OUT" "crustcraft-database-url"
assert_contains "$DEPLOY_OUT" "crustcraft-jwt-secret"
assert_contains "$DEPLOY_OUT" "crustcraft-admin-password"
assert_contains "$DEPLOY_OUT" "crustcraft-demo-password"
assert_contains "$DEPLOY_OUT" "--password=<REDACTED>"

TEARDOWN_OUT="$(DRY_RUN=1 PROJECT_ID="cpe334-crustcraft" REGION="asia-southeast1" bash deploy/teardown.sh)"
assert_contains "$TEARDOWN_OUT" "gcloud sql instances delete crustcraft-pg"
assert_contains "$TEARDOWN_OUT" "gcloud run services delete crustcraft"

echo "PASS: test_deploy_stub.sh"
