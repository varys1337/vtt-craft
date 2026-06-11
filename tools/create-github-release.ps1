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

  $dirty = git status --short
  if ($dirty) {
    throw "Working tree is not clean. Commit the upgrade first, then run this script. Current changes:`n$dirty"
  }

  # Do not use `gh release view $tag` here. On the first release it correctly returns
  # "release not found", but Windows PowerShell can treat that expected stderr output
  # as a NativeCommandError when `$ErrorActionPreference` is Stop.
  $releaseListOutput = & gh release list --limit 100 --json tagName 2>&1
  $releaseListExitCode = $LASTEXITCODE
  if ($releaseListExitCode -ne 0) {
    throw "Unable to list GitHub releases. Check 'gh auth status' and repository access. gh output:`n$releaseListOutput"
  }

  $releases = @()
  $releaseListText = ($releaseListOutput | Out-String).Trim()
  if ($releaseListText) {
    $parsedReleases = $releaseListText | ConvertFrom-Json
    if ($parsedReleases) { $releases = @($parsedReleases) }
  }

  $existingRelease = $releases | Where-Object { $_.tagName -eq $tag } | Select-Object -First 1
  if ($existingRelease) {
    throw "GitHub release $tag already exists. Bump module.json version before creating another release."
  }

  if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
  New-Item -ItemType Directory -Path $dist | Out-Null
  Compress-Archive -Path @("module.json", "fonts", "images", "scripts", "styles") -DestinationPath $asset -Force
  Copy-Item "module.json" (Join-Path $dist "module.json") -Force

  if (-not $SkipPush) {
    git push origin HEAD

    $existingLocalTag = git tag --list $tag
    if (-not $existingLocalTag) { git tag $tag }

    $existingRemoteTag = git ls-remote --tags origin "refs/tags/$tag"
    if (-not $existingRemoteTag) { git push origin $tag }
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
