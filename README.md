# VTT Craft

A World of Warcraft-inspired UI skin for Foundry Virtual Tabletop v14.363.

This rebuild targets Foundry VTT v14.363 and dnd5e 5.3.3. It keeps Foundry-owned UI behavior intact and applies additive visual decoration to the core interface, chat, sidebar controls, hotbar, dialogs, and outer application chrome.

## Installation

Use this manifest URL in Foundry's module installer:

```text
https://raw.githubusercontent.com/varys1337/vtt-craft/master/module.json
```

The release ZIP is published as:

```text
https://github.com/varys1337/vtt-craft/releases/latest/download/vtt-craft.zip
```

## Release process

The repository includes two release paths.

### GitHub Actions

Run **Build and publish release** manually from the Actions tab, or push a tag matching the manifest version, for example:

```powershell
git tag v0.4.17
git push origin v0.4.17
```

The workflow validates `module.json`, checks the module script syntax, builds `dist/vtt-craft.zip`, uploads `module.json`, and creates a GitHub release.

### Local PowerShell command

After committing the upgrade, run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/create-github-release.ps1
```

The script packages the module and creates a GitHub release using GitHub CLI. It requires `gh auth login` to have been completed.

## Cleaning older runtime files

After applying this upgrade over the legacy repo, remove unreferenced v0 files with:

```powershell
powershell -ExecutionPolicy Bypass -File tools/clean-obsolete-v0-files.ps1
```

The cleanup script preserves `fonts/LifeCraft_Font.ttf`, which remains required by the module CSS.

## License

Most images are property of or based upon images by Blizzard Entertainment.

Original code attribution: Felix Müller / VTT Craft, licensed under Creative Commons Attribution 4.0 International License.

This work is licensed under the Foundry Virtual Tabletop EULA / Limited License Agreement for module development.
