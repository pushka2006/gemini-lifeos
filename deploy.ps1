<#
.SYNOPSIS
  Automated Cloud Run Deployment Script for Gemini LifeOS
  Attaches required verification label: dev-tutorial=cloud-run-ai-challenge
#>

# Ensure gcloud is in PATH for this session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") + ";$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🌌 Gemini LifeOS - Cloud Run Deployment Assistant        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Authentication
$accounts = & gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $accounts) {
    Write-Host "`n🔐 No active Google Cloud session found. Launching browser login..." -ForegroundColor Yellow
    & gcloud auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed or was cancelled." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n✅ Logged in as: $accounts" -ForegroundColor Green
}

# 2. Check / Select Google Cloud Project
$currentProject = & gcloud config get-value project 2>$null
if (-not $currentProject -or $currentProject -eq "(unset)") {
    Write-Host "`n📋 Fetching your Google Cloud Projects..." -ForegroundColor Cyan
    & gcloud projects list
    $projectId = Read-Host "`nEnter your Google Cloud Project ID"
    if (-not $projectId) {
        Write-Host "❌ Project ID cannot be empty." -ForegroundColor Red
        exit 1
    }
    & gcloud config set project $projectId
} else {
    $projectId = $currentProject
    Write-Host "📦 Active Project: $projectId" -ForegroundColor Green
}

# 3. Enable Required GCP APIs
Write-Host "`n⚙️  Enabling Cloud Run and Cloud Build APIs (if not already enabled)..." -ForegroundColor Cyan
& gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# 4. Deploy to Cloud Run with required verification label
Write-Host "`n🚀 Deploying Gemini LifeOS to Cloud Run with required verification label..." -ForegroundColor Green
Write-Host "🏷️  Label: dev-tutorial=cloud-run-ai-challenge" -ForegroundColor Cyan
Write-Host "🌍 Region: us-central1`n" -ForegroundColor Cyan

& gcloud run deploy gemini-lifeos `
    --source . `
    --region us-central1 `
    --allow-unauthenticated `
    --labels dev-tutorial=cloud-run-ai-challenge

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "`n🔍 Verifying Cloud Run Label..." -ForegroundColor Cyan
    & gcloud run services describe gemini-lifeos --region us-central1 --format="value(metadata.labels)"
    Write-Host "`n⭐ You are now ready to click 'Verify' in your Challenge Portal!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment encountered an error. Check logs above." -ForegroundColor Red
}
