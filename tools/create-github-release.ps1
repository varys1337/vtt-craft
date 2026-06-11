[CmdletBinding()]
param(
  [switch] $Draft,
  [switch] $Prerelease,
  [switch] $SkipPush
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $Root
try {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is required. Install it and run 'gh auth login' first."
  }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is required."
  }

  $manifest = Get-Content "module.json" -Raw | ConvertFrom-Json
  $moduleId = if ($manifest.id) { $manifest.id } else { $manifest.name }
  if (-not $moduleId) { throw "module.json must define id or name." }
  if (-not $manifest.version) { throw "module.json must define version." }

  $tag = "v$($manifest.version)"
  $assetName = "$moduleId.zip"
  $dist = Join-Path $Root "dist"
  $asset = Join-Path $dist $assetName

  foreach ($required in @("module.json", "fonts", "images", "scripts", "styles")) {
    if (-not (Test-Path $required)) { throw "Required package path is missing: $required" }
  }
  if (-not (Test-Path "fonts/LifeCraft_Font.ttf")) {
    throw "Missing fonts/LifeCraft_Font.ttf. Keep the existing font asset in the repository before releasing."
  }

  node --check "scripts/vtt-craft.mjs" | Out-Host

  if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
  New-Item -ItemType Directory -Path $dist | Out-Null
  Compress-Archive -Path @("module.json", "fonts", "images", "scripts", "styles") -DestinationPath $asset -Force
  Copy-Item "module.json" (Join-Path $dist "module.json") -Force

  $dirty = git status --short
  if ($dirty) {
    throw "Working tree is not clean. Commit the upgrade first, then run this script. Current changes:`n$dirty"
  }

  $existingRelease = gh release view $tag 2>$null
  if ($LASTEXITCODE -eq 0) {
    throw "GitHub release $tag already exists. Bump module.json version before creating another release."
  }

  if (-not $SkipPush) {
    git push origin HEAD
    $existingTag = git tag --list $tag
    if (-not $existingTag) { git tag $tag }
    git push origin $tag
  }

  $args = @(
    "release", "create", $tag,
    "$asset#$assetName",
    "dist/module.json#module.json",
    "--title", "VTT Craft $tag",
    "--notes", "Automated Foundry VTT module release for VTT Craft $($manifest.version).",
    "--latest"
  )
  if ($Draft) { $args += "--draft" }
  if ($Prerelease) { $args += "--prerelease" }

  gh @args
  Write-Host "Created GitHub release $tag with asset $assetName."
}
finally {
  Pop-Location
}
