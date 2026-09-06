#!/usr/bin/env bash
# ==============================================================================
# Cloud Run AI Challenge: Apply Required Verification Label
# Label: dev-tutorial=cloud-run-ai-challenge
# ==============================================================================

set -e

# Prompt or use arguments / environment variables
SERVICE_NAME="${1:-${CLOUD_RUN_SERVICE}}"
REGION="${2:-${CLOUD_RUN_REGION}}"

if [ -z "$SERVICE_NAME" ]; then
  read -rp "Enter your Cloud Run Service Name (e.g. gemini-lifeos): " SERVICE_NAME
fi

if [ -z "$REGION" ]; then
  read -rp "Enter your Cloud Run Region (e.g. us-central1): " REGION
fi

echo "🏷️  Applying verification label to service: $SERVICE_NAME (Region: $REGION)..."

gcloud run services update "$SERVICE_NAME" \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region="$REGION"

echo ""
echo "✅ Successfully applied label! Current service labels:"
gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format="value(metadata.labels)"

echo ""
echo "🎉 You are now ready to pass the 'Is the service labelled dev-tutorial=cloud-run-ai-challenge?' verification!"
