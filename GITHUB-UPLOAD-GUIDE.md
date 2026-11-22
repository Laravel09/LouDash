# LouDash — Upload the prepared project to the new GitHub repository

Target repository: https://github.com/Laravel09/LouDash.git

This package preserves the existing LouDash source structure and original game assets. It stores the 36 WebP and 17 MP3 runtime assets as ordinary Git files, not Git LFS pointers. Do not move or rename the assets.

## 1. Extract the ZIP

Extract `LouDash-GitHub-Ready.zip` into:

`C:\Users\ADMIN\Documents\LouDash-GitHub-Ready`

The actual project root is the inner `LouDash` folder:

`C:\Users\ADMIN\Documents\LouDash-GitHub-Ready\LouDash`

Open that inner `LouDash` folder in VS Code using File > Open Folder. Do not open the outer `LouDash-GitHub-Ready` folder.

## 2. Verify you opened the correct folder

Open VS Code Terminal and select PowerShell. Run:

```powershell
Get-Location
Test-Path .\package.json
Test-Path .\src\assets\audio\music-city.mp3
(Get-Item .\src\assets\audio\music-city.mp3).Length
(Get-ChildItem .\src\assets\characters\rig -Filter *.webp).Count
(Get-ChildItem .\src\assets\environments -Filter *.webp).Count
(Get-ChildItem .\src\assets\audio -Filter *.mp3).Count
```

Expected: both `Test-Path` commands return `True`; music-city.mp3 is 1192481 bytes; character rig count is 27; environment count is 9; audio count is 17.

## 3. Initialize Git in this extracted project

The ZIP intentionally does not contain a `.git` directory. Run these commands in the project root:

```powershell
git init -b main
git remote add origin https://github.com/Laravel09/LouDash.git
git remote -v
```

Confirm BOTH fetch and push URLs are exactly:

`https://github.com/Laravel09/LouDash.git`

The GitHub repository was checked and was empty when this guide was prepared. If you added a README, license, or any commit on GitHub since then, stop before pushing and share the output of `git ls-remote --heads origin`.

## 4. Confirm the assets are not being treated as LFS pointers

```powershell
git check-attr filter -- src/assets/audio/music-menu.mp3 src/assets/characters/rig/lou-torso.webp src/assets/environments/city-scene.webp
```

Expected: all three paths show `filter: unspecified`.

Check the files are real binaries, not pointer text:

```powershell
Get-Content .\src\assets\audio\music-menu.mp3 -TotalCount 1 -ErrorAction SilentlyContinue
```

This last command is not a reliable binary test by itself; use the file sizes and asset manifest instead. Do not open binary files in an editor and save them.

## 5. Stage and review before committing

```powershell
git add -A
git status --short
git diff --cached --stat
```

Review that source files, `.gitattributes`, `pnpm-lock.yaml`, all character/environment WebP files, and all MP3 files are included. Do not proceed if the asset files are absent or if Git reports unexpected LFS pointer-only changes.

## 6. Commit and push

```powershell
git commit -m "Upload complete LouDash project and assets"
git push -u origin main
```

Do not use `git push --force`. If Git rejects the push or reports a non-fast-forward error, stop and share the complete output.

## 7. Verify GitHub and Vercel

Refresh https://github.com/Laravel09/LouDash and confirm the source and `src/assets` folders are present. Open several WebP/MP3 files in GitHub to verify they are ordinary files, not LFS pointer text.

If Vercel is already connected to `Laravel09/LouDash`, the push should trigger a deployment. Wait for the build to finish, then test the deployed game. If Vercel is connected to another repository, update its Git connection to `Laravel09/LouDash` before expecting this push to deploy.

## Safety notes

- Keep the old `C:\Users\ADMIN\Documents\LouDash` folder as a backup until the new repository and deployment are verified.
- Do not move assets to different folders.
- Do not copy the old `.git` directory into this prepared folder.
- Do not add Git LFS filters for `*.webp` or `*.mp3` unless intentionally migrating to LFS and uploading every object.
- Do not force-push or delete the backup.
