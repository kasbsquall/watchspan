# Watchspan deployment to Cloud Run.
# Prerequisites: gcloud auth login; gcloud config set project <PROJECT_ID>
# Cost posture per the hackathon guidance: scale to zero, hard instance cap,
# non-secret config via --set-env-vars (never as secrets).
#
# Usage:  .\deploy\deploy.ps1 -ProjectId my-project [-Region us-central1]

param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [string]$Region = "us-central1"
)

$ErrorActionPreference = "Stop"

Write-Host "Enabling required services..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com --project $ProjectId

Write-Host "Deploying the Watchspan API..."
gcloud run deploy watchspan-api `
  --project $ProjectId `
  --region $Region `
  --source . `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --memory 512Mi `
  --cpu 1 `
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$ProjectId,GOOGLE_CLOUD_LOCATION=$Region,GOOGLE_GENAI_USE_VERTEXAI=true"

$apiUrl = gcloud run services describe watchspan-api --project $ProjectId --region $Region --format "value(status.url)"
Write-Host "API deployed at $apiUrl"

Write-Host "Deploying the Watchspan control room..."
Push-Location web
gcloud run deploy watchspan-web `
  --project $ProjectId `
  --region $Region `
  --source . `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --memory 512Mi `
  --cpu 1 `
  --set-build-env-vars "NEXT_PUBLIC_API_URL=$apiUrl"
Pop-Location

$webUrl = gcloud run services describe watchspan-web --project $ProjectId --region $Region --format "value(status.url)"
Write-Host ""
Write-Host "Watchspan is live:"
Write-Host "  Control room: $webUrl"
Write-Host "  API:          $apiUrl"
Write-Host ""
Write-Host "After recording the demo, tear everything down with:"
Write-Host "  gcloud run services delete watchspan-api watchspan-web --region $Region --project $ProjectId"
