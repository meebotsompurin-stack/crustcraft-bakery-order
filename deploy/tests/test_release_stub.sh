#!/usr/bin/env bash
set -euo pipefail

# Offline verification of deploy/release.sh using a stubbed gcloud CLI

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

GCLOUD_LOG="${TMP_DIR}/gcloud.log"
ENV_FILE="${TMP_DIR}/github_env"

cat > "${TMP_DIR}/gcloud" << 'EOF'
#!/usr/bin/env bash
echo "$*" >> "${GCLOUD_LOG}"
if [[ "$1 $2 $3 $4" == "artifacts docker images describe" ]]; then
  echo "sha256:1111111111111111111111111111111111111111111111111111111111111111"
  exit 0
fi
if [[ "$1 $2 $3" == "run services describe" ]]; then
  echo "https://crustcraft-stub-as.a.run.app"
  exit 0
fi
exit 0
EOF
chmod +x "${TMP_DIR}/gcloud"

export PATH="${TMP_DIR}:${PATH}"
export GCLOUD_LOG

VALID_SHA="0123456789abcdef0123456789abcdef01234567"
EXPECTED_DIGEST="asia-southeast1-docker.pkg.dev/cpe334-crustcraft/crustcraft/crustcraft@sha256:1111111111111111111111111111111111111111111111111111111111111111"

# 1. Short/invalid SHA must fail
if PROJECT_ID="cpe334-crustcraft" REGION="asia-southeast1" IMAGE_TAG="shortsha" bash deploy/release.sh >/dev/null 2>&1; then
  echo "ASSERTION FAILED: release.sh should reject short SHA" >&2
  exit 1
fi

# 2. Normal release (ROLLBACK=false) must run migration job and update service by digest
: > "$GCLOUD_LOG"
: > "$ENV_FILE"
PROJECT_ID="cpe334-crustcraft" \
REGION="asia-southeast1" \
IMAGE_TAG="$VALID_SHA" \
ROLLBACK="false" \
GITHUB_ENV="$ENV_FILE" \
bash deploy/release.sh >/dev/null

grep -q "run jobs update crustcraft-migrate --image=${EXPECTED_DIGEST}" "$GCLOUD_LOG"
grep -q "run jobs execute crustcraft-migrate" "$GCLOUD_LOG"
grep -q "run services update crustcraft --image=${EXPECTED_DIGEST}" "$GCLOUD_LOG"
grep -q "run services update-traffic crustcraft --region=asia-southeast1 --to-latest" "$GCLOUD_LOG"
grep -q "DEPLOYED_IMAGE=${EXPECTED_DIGEST}" "$ENV_FILE"
grep -q "SERVICE_URL=https://crustcraft-stub-as.a.run.app" "$ENV_FILE"

# 3. Rollback mode (ROLLBACK=true) must skip migration job and update service by digest
: > "$GCLOUD_LOG"
PROJECT_ID="cpe334-crustcraft" \
REGION="asia-southeast1" \
IMAGE_TAG="$VALID_SHA" \
ROLLBACK="true" \
bash deploy/release.sh >/dev/null

if grep -q "run jobs" "$GCLOUD_LOG"; then
  echo "ASSERTION FAILED: Rollback mode must not update or execute migration job" >&2
  exit 1
fi
grep -q "run services update crustcraft --image=${EXPECTED_DIGEST}" "$GCLOUD_LOG"
grep -q "run services update-traffic crustcraft --region=asia-southeast1 --to-latest" "$GCLOUD_LOG"

echo "PASS: test_release_stub.sh"
