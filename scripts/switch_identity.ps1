
param (
    [string]$ProfileName
)

$profiles = @{
    "civil" = @{
        "name"  = "englabscivil"
        "email" = "englabscivil@users.noreply.github.com"
    };
    "barry" = @{
        "name"   = "barrydeveloperindia"
        "email"  = "barrydeveloperindia@gmail.com"
        "secret" = "123"
    }
}

if (-not $ProfileName) {
    Write-Host "Select Identity Profile:" -ForegroundColor Cyan
    Write-Host "1. Civil (General Use)"
    Write-Host "2. Barry (Owner/Admin)"
    $choice = Read-Host "Choice (1 or 2)"
    if ($choice -eq "1") { $ProfileName = "civil" }
    elseif ($choice -eq "2") { $ProfileName = "barry" }
    else { Write-Error "Invalid Choice"; exit 1 }
}

$p = $profiles[$ProfileName]
if (-not $p) {
    Write-Error "Profile $ProfileName not found."
    exit 1
}

if ($ProfileName -eq "barry") {
    $attempt = Read-Host "Enter Secret for Barry Identity" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($attempt)
    $plainSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    
    if ($plainSecret -ne $p.secret) {
        Write-Host "❌ ACCESS DENIED: Incorrect Secret." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔐 Switching Git Identity to: $($p.name)..." -ForegroundColor Green
git config user.name $p.name
git config user.email $p.email

Write-Host "✅ Identity Verified and Applied." -ForegroundColor Green
