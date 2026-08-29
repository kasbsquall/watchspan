# Watchspan deployment to Cloud Run.
# Prerequisites: gcloud auth login; gcloud config set project <PROJECT_ID>
# Cost posture per the hackathon guidance: scale to zero, hard instance cap,
# non-secret config via --set-env-vars (never as secrets).
#
# Usage:  .\deploy\deploy.ps1 -ProjectId my-project [-Region us-central1]

param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [string]$Region = "us-central1",
  # The GEAP wiring. Each degrades gracefully when empty, and leaving them empty
  # is how the running service ended up ahead of this script: production had the
  # Memory Bank engine and the Model Armor template set by hand, while a fresh
  # deploy from here came up on the local fallbacks. Read the running values with
  #   gcloud run services describe watchspan-api --region <r> `
  #     --format="value(spec.template.spec.containers[0].env)"
  [string]$AgentEngineId = $env:WATCHSPAN_AGENT_ENGINE_ID,
  [string]$ModelArmorTemplate = $env:WATCHSPAN_MODEL_ARMOR_TEMPLATE,
  [string]$FleetServiceAccount = $env:WATCHSPAN_FLEET_SERVICE_ACCOUNT,
  # Signs reviewer identities. Left empty, one is generated and then reused from
  # the running service on later deploys.
  [string]$ReviewerSecret = $env:WATCHSPAN_REVIEWER_SECRET
)

$ErrorActionPreference = "Stop"

Write-Host "Enabling required services..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com --project $ProjectId

$apiEnv = "GOOGLE_CLOUD_PROJECT=$ProjectId,GOOGLE_CLOUD_LOCATION=$Region,GOOGLE_GENAI_USE_VERTEXAI=true"
if ($AgentEngineId)       { $apiEnv += ",WATCHSPAN_AGENT_ENGINE_ID=$AgentEngineId" }
if ($ModelArmorTemplate)  { $apiEnv += ",WATCHSPAN_MODEL_ARMOR_TEMPLATE=$ModelArmorTemplate" }
if ($FleetServiceAccount) { $apiEnv += ",WATCHSPAN_FLEET_SERVICE_ACCOUNT=$FleetServiceAccount" }

# The key that signs reviewer identities. Without this the service falls back to
# a development value published in this repository, and a reviewer computed a
# live reviewer id offline and matched it exactly. Generated once and reused on
# later deploys, so ids stay stable for a given deployment.
if (-not $ReviewerSecret) {
  $existing = gcloud run services describe watchspan-api --project $ProjectId --region $Region `
    --format "value(spec.template.spec.containers[0].env.filter(name='WATCHSPAN_REVIEWER_SECRET').extract(value))" 2>$null
  if ($existing) {
    $ReviewerSecret = $existing
    Write-Host "Reusing the reviewer signing key already on the service."
  } else {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $ReviewerSecret = [Convert]::ToBase64String($bytes)
    Write-Host "Generated a new reviewer signing key."
  }
}
$apiEnv += ",WATCHSPAN_REVIEWER_SECRET=$ReviewerSecret"

# Never print the key. Everything else in this string is non-secret config.
Write-Host "API env: $(($apiEnv -split ',' | Where-Object { $_ -notlike 'WATCHSPAN_REVIEWER_SECRET=*' }) -join ',')"

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
  --session-affinity `
  --set-env-vars $apiEnv

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
