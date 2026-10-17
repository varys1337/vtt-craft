[CmdletBinding()]
param(
  [string] $SourcePath,
  [string] $Version
)

$ErrorActionPreference = "Stop"
$repository = "varys1337/vtt-craft"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$runtimePaths = @("module.json", "fonts", "images", "scripts", "styles")
$excludedExtensions = @(".bak", ".lock", ".log", ".tmp")
$versionPattern = '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$'

function Invoke-ReleaseCommand {
  param([string] $Command, [string[]] $Arguments)

  # Windows PowerShell 5.1 may otherwise throw on a successful native command's stderr.
  $ErrorActionPreference = "Continue"
  $commandOutput = & $Command @Arguments 2>&1
  $commandExitCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  $commandText = (($commandOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim()
  if ($commandExitCode -ne 0) {
    throw "$Command failed (exit $commandExitCode).`n$commandText"
  }
  return $commandText
}

Push-Location -LiteralPath $repoRoot
try {
  foreach ($command in @("git", "gh", "node")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
      throw "$command is required. Install Git, GitHub CLI, and Node.js; run 'gh auth login' first."
    }
  }

  $dirty = Invoke-ReleaseCommand git @("status", "--porcelain")
  if ($dirty) { throw "Commit or stash existing changes before releasing.`n$dirty" }
  $origin = Invoke-ReleaseCommand git @("remote", "get-url", "origin")
  if ($origin -notmatch '^https://github\.com/varys1337/vtt-craft(?:\.git)?/?$' -and
      $origin -notmatch '^git@github\.com:varys1337/vtt-craft(?:\.git)?$') {
    throw "origin must point to $repository. Current origin: $origin"
  }
  $repoInfo = (Invoke-ReleaseCommand gh @("repo", "view", $repository, "--json", "defaultBranchRef")) | ConvertFrom-Json
  $branch = $repoInfo.defaultBranchRef.name
  $currentBranch = Invoke-ReleaseCommand git @("branch", "--show-current")
  if ($currentBranch -ne $branch) { throw "Check out the default branch '$branch' before releasing." }
  Invoke-ReleaseCommand git @("fetch", "origin", $branch, "--tags") | Out-Host
  Invoke-ReleaseCommand git @("merge-base", "--is-ancestor", "origin/$branch", "HEAD") | Out-Null

  $repoManifest = Get-Content -LiteralPath "module.json" -Raw | ConvertFrom-Json
  if ($repoManifest.id -ne "vtt-craft" -or $repoManifest.version -notmatch $versionPattern) {
    throw "module.json must define id 'vtt-craft' and a numeric major.minor.patch version."
  }
  $candidate = [version] $repoManifest.version
  $sourceRoot = $repoRoot
  if ($SourcePath) { $sourceRoot = (Resolve-Path -LiteralPath $SourcePath).Path }
  $sourceManifest = Get-Content -LiteralPath (Join-Path $sourceRoot "module.json") -Raw | ConvertFrom-Json
  if ($sourceManifest.id -ne "vtt-craft" -or $sourceManifest.version -notmatch $versionPattern) {
    throw "The source manifest must define id 'vtt-craft' and a numeric major.minor.patch version."
  }
  if ([version] $sourceManifest.version -gt $candidate) { $candidate = [version] $sourceManifest.version }

  $sourceFiles = @{}
  foreach ($runtimePath in $runtimePaths) {
    $source = Join-Path $sourceRoot $runtimePath
    if (-not (Test-Path -LiteralPath $source)) { throw "Required package path is missing: $source" }
    foreach ($entry in @(Get-Item -LiteralPath $source) + @(Get-ChildItem -LiteralPath $source -Recurse -Force)) {
      if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Runtime paths must not contain symbolic links or junctions: $($entry.FullName)"
      }
      if ($entry.PSIsContainer -or $entry.Extension -in $excludedExtensions) { continue }
      $relativePath = $entry.FullName.Substring($sourceRoot.TrimEnd('\').Length + 1)
      $sourceFiles[$relativePath] = $entry.FullName
    }
  }
  foreach ($requiredFile in @("fonts/LifeCraft_Font.ttf") + @($sourceManifest.esmodules) + @($sourceManifest.styles)) {
    if (-not $sourceFiles.ContainsKey($requiredFile.Replace('/', '\'))) {
      throw "Manifest runtime file is missing or outside the package: $requiredFile"
    }
  }
  Invoke-ReleaseCommand node @("--check", (Join-Path $sourceRoot "scripts/vtt-craft.mjs")) | Out-Host

  $latestTaggedVersion = [version] "0.0.0"
  $tags = Invoke-ReleaseCommand git @("tag", "--list", "v*.*.*")
  foreach ($existingTag in ($tags -split '\r?\n')) {
    $tagVersion = $existingTag -replace '^v', ''
    if ($tagVersion -match $versionPattern -and [version] $tagVersion -gt $latestTaggedVersion) {
      $latestTaggedVersion = [version] $tagVersion
    }
  }
  if ($Version) {
    if ($Version -notmatch $versionPattern) { throw "-Version must use major.minor.patch, for example 0.5.2." }
    if ([version] $Version -lt $candidate -or [version] $Version -le $latestTaggedVersion) {
      throw "Choose a version at least $candidate and newer than the highest existing tag ($latestTaggedVersion)."
    }
    $candidate = [version] $Version
  }
  elseif ($candidate -le $latestTaggedVersion) {
    $candidate = [version] ("{0}.{1}.{2}" -f $latestTaggedVersion.Major, $latestTaggedVersion.Minor, ($latestTaggedVersion.Build + 1))
  }
  $releaseVersion = $candidate.ToString(3)
  $tag = "v$releaseVersion"
  Write-Host "Preparing VTT Craft $tag from $sourceRoot"

  if ($sourceRoot -ne $repoRoot) {
    # Mirror runtime files only. Repository documentation, tools, and workflows stay in place.
    foreach ($runtimePath in $runtimePaths) {
      $destination = Join-Path $repoRoot $runtimePath
      if (-not (Test-Path -LiteralPath $destination)) { continue }
      foreach ($entry in @(Get-Item -LiteralPath $destination) + @(Get-ChildItem -LiteralPath $destination -Recurse -Force)) {
        if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) {
          throw "Repository runtime paths must not contain symbolic links or junctions: $($entry.FullName)"
        }
        if ($entry.PSIsContainer) { continue }
        $relativePath = $entry.FullName.Substring($repoRoot.Length + 1)
        if (-not $sourceFiles.ContainsKey($relativePath)) { Remove-Item -LiteralPath $entry.FullName -Force }
      }
    }
    foreach ($relativePath in $sourceFiles.Keys) {
      $destination = Join-Path $repoRoot $relativePath
      New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
      Copy-Item -LiteralPath $sourceFiles[$relativePath] -Destination $destination -Force
    }
  }

  # The stable update URL changes only when GitHub publishes a complete release.
  # Pin the ZIP to this version so each historical manifest remains installable.
  $manifestUpdater = @'
const fs = require('node:fs');
const [file, version] = process.argv.slice(1);
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
manifest.version = version;
manifest.manifest = 'https://github.com/varys1337/vtt-craft/releases/latest/download/module.json';
manifest.download = 'https://github.com/varys1337/vtt-craft/releases/download/v' + version + '/vtt-craft.zip';
fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
'@
  Invoke-ReleaseCommand node @("-e", $manifestUpdater, (Join-Path $repoRoot "module.json"), $releaseVersion) | Out-Host
  Invoke-ReleaseCommand git (@("add", "--") + $runtimePaths) | Out-Null
  if (Invoke-ReleaseCommand git @("diff", "--cached", "--name-only")) {
    Invoke-ReleaseCommand git @("commit", "-m", "Release VTT Craft $tag") | Out-Host
  }
  Invoke-ReleaseCommand git @("tag", "-a", $tag, "-m", "VTT Craft $tag") | Out-Host
  # One atomic push prevents a branch/tag split. Actions is the sole release publisher.
  Invoke-ReleaseCommand git @("push", "--atomic", "origin", "HEAD:refs/heads/$branch", "refs/tags/$tag") | Out-Host

  Write-Host "Pushed $tag. GitHub Actions will build both assets and publish it as Latest."
  Write-Host "Follow progress: gh run list --repo $repository --workflow release.yml --branch $tag"
  Write-Host "Release: https://github.com/$repository/releases/tag/$tag"
}
finally {
  Pop-Location
}
