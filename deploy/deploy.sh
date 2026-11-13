#!/usr/bin/env bash
set -euo pipefail

# CrustCraft One-Time Initial GCP Provisioning & Deployment Script (Episode 5)
# Policy B1: Keep Cloud Run and Cloud SQL running continuously until grading has ended
# and Lab 6 partner UAT is complete. Pausing during this period is strictly prohibited.

SEED_DEMO_DATA="${SEED_DEMO_DATA:-false}"
for arg in "$@"; do
  case "$arg" in
    --demo)
      SEED_DEMO_DATA="true"
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: PROJECT_ID=<id> [REGION=asia-southeast1] [DRY_RUN=1] bash deploy/deploy.sh [--demo]" >&2
      exit 1
      ;;
  esac
done

PROJECT_ID="${PROJECT_ID:?ERROR: PROJECT_ID environment variable is required}"
REGION="${REGION:-asia-southeast1}"
DRY_RUN="${DRY_RUN:-0}"

REPO_NAME="${REPO_NAME:-crustcraft}"
SQL_INSTANCE="${SQL_INSTANCE:-crustcraft-pg}"
DB_NAME="${DB_NAME:-crustcraft}"
DB_USER="${DB_USER:-crustcraft}"
SERVICE_NAME="${SERVICE_NAME:-crustcraft}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-crustcraft-migrate}"
SA_NAME="${SA_NAME:-crustcraft-runner}"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SQL_CONN_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

SECRET_DB_URL="crustcraft-database-url"
SECRET_JWT="crustcraft-jwt-secret"
SECRET_ADMIN_PASS="crustcraft-admin-password"
SECRET_DEMO_PASS="crustcraft-demo-password"

run_cmd() {
  local display_args=()
  for a in "$@"; do
    if [[ "$a" == --password=* ]]; then
      display_args+=("--password=<REDACTED>")
    else
      display_args+=("$a")
    fi
  done

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY_RUN] ${display_args[*]}"
  else
    echo "+ ${display_args[*]}"
    "$@"
  fi
}

ensure_secret_with_value() {
  local secret_name="$1"
  local secret_value="$2"

  if [[ "$DRY_RUN" == "1" ]]; then
    run_cmd gcloud secrets describe "$secret_name" --project "$PROJECT_ID"
    run_cmd gcloud secrets create "$secret_name" --replication-policy="automatic" --project "$PROJECT_ID"
    run_cmd gcloud secrets versions add "$secret_name" --data-file=- --project "$PROJECT_ID"
  else
    if ! gcloud secrets describe "$secret_name" --project "$PROJECT_ID" >/dev/null 2>&1; then
      run_cmd gcloud secrets create "$secret_name" --replication-policy="automatic" --project "$PROJECT_ID"
      printf "%s" "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project "$PROJECT_ID"
    fi
  fi

  run_cmd gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project "$PROJECT_ID" \
    --quiet
}

echo "========================================================"
echo "CrustCraft Cloud Run Deployment"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Demo    : ${SEED_DEMO_DATA}"
echo "Dry Run : ${DRY_RUN}"
echo "========================================================"

# 1. Enable required Google Cloud APIs
run_cmd gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project "$PROJECT_ID"

# 2. Create Artifact Registry repository (idempotent)
if [[ "$DRY_RUN" == "1" ]]; then
  run_cmd gcloud artifacts repositories describe "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID"
  run_cmd gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="CrustCraft container repository" \
    --project "$PROJECT_ID"
else
  if ! gcloud artifacts repositories describe "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud artifacts repositories create "$REPO_NAME" \
      --repository-format=docker \
      --location="$REGION" \
      --description="CrustCraft container repository" \
      --project "$PROJECT_ID"
  fi
fi

# 3. Create Cloud SQL for PostgreSQL 16 instance (db-f1-micro, Enterprise, 10GB SSD, auto-increase OFF)
if [[ "$DRY_RUN" == "1" ]]; then
  run_cmd gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT_ID"
  run_cmd gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_16 \
    --edition=enterprise \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-size=10GB \
    --storage-type=SSD \
    --no-storage-auto-increase \
    --backup-start-time=03:00 \
    --project "$PROJECT_ID"
else
  if ! gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud sql instances create "$SQL_INSTANCE" \
      --database-version=POSTGRES_16 \
      --edition=enterprise \
      --tier=db-f1-micro \
      --region="$REGION" \
      --storage-size=10GB \
      --storage-type=SSD \
      --no-storage-auto-increase \
      --backup-start-time=03:00 \
      --project "$PROJECT_ID"
  fi
fi

# 4. Create application database (idempotent)
if [[ "$DRY_RUN" == "1" ]]; then
  run_cmd gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
  run_cmd gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
else
  if ! gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
  fi
fi

# 5. Create dedicated runtime service account and grant Cloud SQL Client
if [[ "$DRY_RUN" == "1" ]]; then
  run_cmd gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID"
  run_cmd gcloud iam service-accounts create "$SA_NAME" \
    --display-name="CrustCraft Cloud Run Service Account" \
    --project "$PROJECT_ID"
else
  if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud iam service-accounts create "$SA_NAME" \
      --display-name="CrustCraft Cloud Run Service Account" \
      --project "$PROJECT_ID"
  fi
fi

run_cmd gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client" \
  --condition=None \
  --quiet

# 6. Create DB user and store DATABASE_URL in Secret Manager
if [[ "$DRY_RUN" == "1" ]]; then
  run_cmd gcloud secrets describe "$SECRET_DB_URL" --project "$PROJECT_ID"
  run_cmd gcloud sql users list --instance="$SQL_INSTANCE" --project "$PROJECT_ID" --format="value(name)"
  run_cmd gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="dry-run-password" --project "$PROJECT_ID"
  run_cmd gcloud secrets create "$SECRET_DB_URL" --replication-policy="automatic" --project "$PROJECT_ID"
  run_cmd gcloud secrets versions add "$SECRET_DB_URL" --data-file=- --project "$PROJECT_ID"
else
  if ! gcloud secrets describe "$SECRET_DB_URL" --project "$PROJECT_ID" >/dev/null 2>&1; then
    DB_PASS="$(openssl rand -hex 24)"
    if gcloud sql users list --instance="$SQL_INSTANCE" --project "$PROJECT_ID" --format="value(name)" | grep -qx "$DB_USER"; then
      run_cmd gcloud sql users set-password "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
    else
      run_cmd gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
    fi
    DB_URL_VALUE="postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONN_NAME}&schema=public"
    run_cmd gcloud secrets create "$SECRET_DB_URL" --replication-policy="automatic" --project "$PROJECT_ID"
    printf "%s" "$DB_URL_VALUE" | gcloud secrets versions add "$SECRET_DB_URL" --data-file=- --project "$PROJECT_ID"
  fi
fi

run_cmd gcloud secrets add-iam-policy-binding "$SECRET_DB_URL" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project "$PROJECT_ID" \
  --quiet

# 7. Create JWT_SECRET and ADMIN_PASSWORD secrets in Secret Manager
JWT_GENERATED="$(openssl rand -hex 32 2>/dev/null || echo 'dry-run-jwt-secret')"
ADMIN_GENERATED="$(openssl rand -base64 18 2>/dev/null | tr -d '/+=' | cut -c1-16 || echo 'DryRunAdminPass1')Aa1!"

ensure_secret_with_value "$SECRET_JWT" "$JWT_GENERATED"
ensure_secret_with_value "$SECRET_ADMIN_PASS" "$ADMIN_GENERATED"

# 8. Optional Demo Password in Secret Manager when --demo is passed
JOB_SECRETS="DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT}:latest,ADMIN_PASSWORD=${SECRET_ADMIN_PASS}:latest"
if [[ "$SEED_DEMO_DATA" == "true" ]]; then
  DEMO_GENERATED="$(openssl rand -base64 18 2>/dev/null | tr -d '/+=' | cut -c1-16 || echo 'DryRunDemoPass1')Dd1!"
  ensure_secret_with_value "$SECRET_DEMO_PASS" "$DEMO_GENERATED"
  JOB_SECRETS="${JOB_SECRETS},DEMO_USER_PASSWORD=${SECRET_DEMO_PASS}:latest"
fi

# 9. Build container image via Cloud Build
run_cmd gcloud builds submit --tag "$IMAGE_URI" . --project "$PROJECT_ID"

# 10. Create/Update & Execute Cloud Run Job for Migration + Non-destructive Seed
run_cmd gcloud run jobs deploy "$MIGRATE_JOB_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --set-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "$JOB_SECRETS" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok,SEED_DEMO_DATA=${SEED_DEMO_DATA}" \
  --command "sh" \
  --args "-c,npx prisma migrate deploy --schema=/app/prisma/schema.prisma && npm run seed" \
  --max-retries 1 \
  --task-timeout 300s \
  --project "$PROJECT_ID"

run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
  --region "$REGION" \
  --wait \
  --project "$PROJECT_ID"

# 11. Deploy Cloud Run Service
run_cmd gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT}:latest" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --port 3000 \
  --project "$PROJECT_ID"

if [[ "$DRY_RUN" == "1" ]]; then
  SERVICE_URL="https://${SERVICE_NAME}-dryrun-as.a.run.app"
else
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"
fi

echo "========================================================"
echo "Deployment Completed!"
echo "Service URL     : ${SERVICE_URL}"
echo "Health Check    : ${SERVICE_URL}/api/health"
echo "Readiness Check : ${SERVICE_URL}/api/ready"
echo "Admin Email     : admin@crustcraft.com"
echo "Admin Password  : Stored in Secret Manager: ${SECRET_ADMIN_PASS} (not printed)."
echo "========================================================"
