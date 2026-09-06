<#
.SYNOPSIS
  Cloud Run AI Challenge: Apply Required Verification Label
  Label: dev-tutorial=cloud-run-ai-challenge
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceName,

    [Parameter(Mandatory=$false)]
    [string]$Region
)

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: 'gcloud' CLI is not found in your PATH." -ForegroundColor Red
    Write-Host "👉 Please run this in Google Cloud Shell (in the browser), or install Google Cloud SDK." -ForegroundColor Yellow
    exit 1
}

if (-not $ServiceName) {
    $ServiceName = Read-Host "Enter your Cloud Run Service Name (e.g. gemini-lifeos)"
}

if (-not $Region) {
    $Region = Read-Host "Enter your Cloud Run Region (e.g. us-central1)"
}

Write-Host "🏷️ Applying verification label to service: $ServiceName (Region: $Region)..." -ForegroundColor Cyan

gcloud run services update $ServiceName `
    --update-labels=dev-tutorial=cloud-run-ai-challenge `
    --region=$Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully applied label! Verifying..." -ForegroundColor Green
    gcloud run services describe $ServiceName --region=$Region --format="value(metadata.labels)"
    Write-Host "`n🎉 Verification ready: dev-tutorial=cloud-run-ai-challenge is set!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Failed to update Cloud Run service." -ForegroundColor Red
}
