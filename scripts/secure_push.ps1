
# Secure Push Workflow
# Step 1: Verify Identity
& ".\scripts\switch_identity.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 2: Build Safety Check
Write-Host "🚀 Running Build Safety Check..." -ForegroundColor Cyan
npm run build:local
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Push aborted." -ForegroundColor Red
    exit 1
}

# Step 3: Git Workflow
$commitMsg = Read-Host "Enter Commit Message"
if (-not $commitMsg) { $commitMsg = "chore: system update" }

git add .
git commit -m "$commitMsg"

$branch = git branch --show-current
Write-Host "📤 Pushing to $branch..." -ForegroundColor Green
git push origin $branch

Write-Host "✨ Workflow Complete." -ForegroundColor Green
