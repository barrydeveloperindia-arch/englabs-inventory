# Strict Build Verification Script (Windows PowerShell)
# Simulates a clean CI/CD environment to catch dependency issues locally.

Write-Host "🚧 CLEANING ENVIRONMENT..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "hop-in-express-customerApp/dist") { Remove-Item -Recurse -Force "hop-in-express-customerApp/dist" }

Write-Host "📦 INSTALLING ROOT DEPENDENCIES..." -ForegroundColor Cyan
npm install --silent

Write-Host "📦 Validating Mobile App..." -ForegroundColor Cyan
cd hop-in-express-customerApp

Write-Host "📦 INSTALLING CLIENT APP DEPENDENCIES..." -ForegroundColor Cyan
npm install --silent
cd ..

Write-Host "🔨 BUILDING CLIENT APP..." -ForegroundColor Green
npm run build:client
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ CLIENT BUILD FAILED!" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 BUILDING ROOT APP..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ROOT BUILD FAILED!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ BUILD VERIFIED SUCCESSFULLY!" -ForegroundColor Green
exit 0
