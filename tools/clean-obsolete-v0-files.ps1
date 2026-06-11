[CmdletBinding(SupportsShouldProcess)]
param()

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $Root
try {
  $obsolete = @(
    "wow-ui.js",
    "wow-ui.css",
    "wow-ui.less",
    "alliance_preview.jpg",
    "horde_preview.jpg",
    "neutral_preview.jpg",
    "images/logo.png",
    "images/griffon_cap.PNG",
    "images/border_1.png",
    "images/backgrounds/UIFrameHordeBackground.PNG",
    "images/backgrounds/parchment.png"
  )

  $obsolete += Get-ChildItem "images/buttons" -Filter "*.png" -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
  $obsolete += Get-ChildItem "images/frames" -Filter "*.png" -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }

  foreach ($path in $obsolete) {
    if (Test-Path $path) {
      if ($PSCmdlet.ShouldProcess($path, "Remove obsolete VTT Craft v0 runtime asset")) {
        Remove-Item $path -Force
      }
    }
  }

  Write-Host "Obsolete v0 runtime files removed. fonts/LifeCraft_Font.ttf was intentionally preserved."
}
finally {
  Pop-Location
}
