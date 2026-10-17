# VTT Craft

A World of Warcraft-inspired UI skin for Foundry Virtual Tabletop **14.368 and newer**.

VTT Craft decorates the core interface, ApplicationV2 windows, dialogs, document sheets, journals, chat, and hotbar. Foundry and the active game system retain control of their data and native workflows.

The module manifest declares support for D&D 5e 5.3.3+ and UESRPG (`uesrpg-3ev4`) v14.3.1+. Compatibility declarations are not a guarantee for every future system version.

## Installation and updates

Use this manifest URL in Foundry's module installer:

```text
https://github.com/varys1337/vtt-craft/releases/latest/download/module.json
```

The previous manifest URL remains available for existing installations:

```text
https://raw.githubusercontent.com/varys1337/vtt-craft/master/module.json
```

Each published manifest contains a higher numeric version and a ZIP URL pinned to that release. The stable manifest URL above follows the GitHub release marked **Latest**. In Foundry Setup, use the module's update action to check for a compatible newer version; publishing a release does not update installations until an update is requested.

The latest ZIP is also available at:

```text
https://github.com/varys1337/vtt-craft/releases/latest/download/vtt-craft.zip
```

This release requires Foundry 14.368+. The runtime files are synchronized from the maintained module; the release process does not add a compatibility verification claim.

## Settings

Enable the module, then open its settings to select Neutral, Horde, Alliance, or None. Settings also control core interface decoration, one of three parchment textures, the chat panel background, and optional Human, Night Elf, Orc, or Undead cursors. These choices are stored per user.

## Publishing future releases on Windows

Install Git, GitHub CLI (`gh`), and Node.js. Authenticate with `gh auth login` using an account that can push to this repository. Start from a clean checkout of the default branch (`master`); commit or stash existing edits first.

From GitHub Desktop's **Open in Command Prompt**, or any command prompt in this repository, run:

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\create-github-release.ps1 -SourcePath "%LOCALAPPDATA%\FoundryVTT\Data\modules\vtt-craft"
```

The helper copies the live runtime files into the repository, excluding backup, lock, log, and temporary files. It preserves repository documentation and release tools. It uses an unreleased source/repository version if it is newer than all existing numeric version tags; otherwise it increases the patch number automatically. The live module folder is read only and its version is not rewritten.

To choose the version yourself, append `-Version 0.5.2` (replace this example with the intended new version). In PowerShell, use `-SourcePath "$env:LOCALAPPDATA\FoundryVTT\Data\modules\vtt-craft"` instead of the Command Prompt environment-variable syntax. Omit `-SourcePath` to release the repository's own runtime files.

The helper updates the manifest, commits runtime changes, creates the version tag, and atomically pushes the default branch and tag. GitHub Actions is the only publisher: it validates the tag and manifest, builds `vtt-craft.zip` with `module.json` at its root, attaches both assets, and publishes a stable release with `--latest`.

Pushing a tag starts publication asynchronously. Confirm that **Build and publish release** succeeds in the repository's Actions tab before announcing the release. The release helper prints commands and links for following progress.

If a workflow fails before a release exists, fix the cause and rerun the failed workflow. To dispatch it again for an existing tag, use `gh workflow run release.yml --ref vX.Y.Z`. Published releases are never overwritten. If an atomic push fails, the local release commit and tag remain for inspection; after resolving the push failure, retry `git push --atomic origin HEAD:refs/heads/master refs/tags/vX.Y.Z` using that exact prepared tag.

The helper publishes stable releases. Draft and prerelease publishing are outside this update channel.

## Attribution

Original code attribution: Felix Müller / VTT Craft, licensed under Creative Commons Attribution 4.0 International License.

This work is licensed under the Foundry Virtual Tabletop EULA / Limited License Agreement for module development.
