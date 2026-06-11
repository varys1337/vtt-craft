# Applying this overlay

1. Extract this overlay into your existing `vtt-craft` repository root.
2. Keep the existing `fonts/LifeCraft_Font.ttf` file in place. It is required by `styles/vtt-craft.css` and is not included in this overlay.
3. In GitHub Desktop, review the changed files.
4. Run the cleanup script to remove obsolete v0 runtime files:

```powershell
powershell -ExecutionPolicy Bypass -File tools/clean-obsolete-v0-files.ps1
```

5. Commit the upgrade.
6. Push to `master`.
7. Create the GitHub release either from Actions or with:

```powershell
powershell -ExecutionPolicy Bypass -File tools/create-github-release.ps1
```
