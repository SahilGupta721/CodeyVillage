#!/bin/bash
set -e

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="productivity-island-backend"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE"

echo "▶ Building and pushing image..."
gcloud builds submit --tag "$IMAGE" .

echo "▶ Storing MONGO_URL as a secret (first deploy only — skip if already exists)..."
echo -n "$MONGO_URL" | gcloud secrets create mongo-url --data-file=- 2>/dev/null || \
  echo -n "$MONGO_URL" | gcloud secrets versions add mongo-url --data-file=-

echo "▶ Deploying to Cloud Run..."
sed "s|IMAGE_PLACEHOLDER|$IMAGE|g" cloudrun.yaml | \
  gcloud run services replace - --region "$REGION"

echo "▶ Making service public..."
gcloud run services add-iam-policy-binding "$SERVICE" \
  --region "$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker"

echo ""
echo "✅ Deployed! Service URL:"
gcloud run services describe "$SERVICE" --region "$REGION" \
  --format="value(status.url)"
