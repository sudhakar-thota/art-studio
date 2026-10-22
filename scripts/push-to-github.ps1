# PowerShell Helper: Initialize Git & Push to GitHub
# Usage: .\scripts\push-to-github.ps1 -RepoUrl "https://github.com/<your-username>/<your-repo-name>.git"

param (
    [Parameter(Mandatory=$false)]
    [string]$RepoUrl
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Atelier Solstice - GitHub Repository Setup      " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Verify git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git command not found in PATH." -ForegroundColor Yellow
    Write-Host "If you have Git installed, please ensure it is added to your environment PATH."
    Write-Host "You can download Git from: https://git-scm.com/download/win"
    Write-Host "Or install via winget: winget install --id Git.Git -e --source winget"
    exit 1
}

# 2. Check if .git exists, initialize if not
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new git repository..." -ForegroundColor Green
    git init
    git branch -M main
}

# 3. Add all files (respecting .gitignore which ignores .env and node_modules)
Write-Host "Staging files (respecting .gitignore)..." -ForegroundColor Green
git add .

# 4. Commit
Write-Host "Creating initial commit..." -ForegroundColor Green
git commit -m "feat: complete art studio application with RBAC, concurrency locks, DESIGN.md & README"

# 5. Remote setup
if (-not $RepoUrl) {
    $RepoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/art-studio.git)"
}

if ($RepoUrl) {
    # Check if origin already exists
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        git remote set-url origin $RepoUrl
    } else {
        git remote add origin $RepoUrl
    }

    Write-Host "Pushing to $RepoUrl..." -ForegroundColor Green
    git push -u origin main
    Write-Host "`n🎉 Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "`nRepository initialized and committed locally. Add remote with:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-repo-url>"
    Write-Host "  git push -u origin main"
}
