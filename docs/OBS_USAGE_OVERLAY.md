# Codex usage in OBS

The Browser Source shows the same animated composing orb used by the Codex sidebar, the native remaining percentage, and the time until the native reset (`5 d 2 h`, for example). Its transparent canvas is 300 × 100 CSS pixels. Color follows the active wallpaper palette. No sample percentage or reset date is substituted when Codex is unavailable.

Build and start the local overlay on Windows:

```powershell
npm run build:obs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\start-obs-overlay.ps1 -InstallStartup
```

`-InstallStartup` adds a user Startup shortcut so the local helper runs after sign-in. It does **not** start or restart Codex. If the Codex Wallpapers data directory is custom, add `-DataRoot "C:\path\to\data"` to that command. The helper binds only to `127.0.0.1:8794` and reads the already verified local Codex session; it never serves credentials or the CDP endpoint. Close the helper or remove the Startup shortcut to disable it.

In OBS, add a **Browser Source** with URL `http://127.0.0.1:8794/`, width **300**, height **100**, and a transparent background. Place it beneath the camera in your scene. Keep the source active when hidden if you want the orb to animate continuously. The percentage is refreshed from Codex; the countdown updates every minute. An unavailable state is shown until Codex Wallpapers is running and the native usage response has arrived.

The OBS source is separate from StreamElements alerts: a StreamElements cloud overlay cannot read a local `127.0.0.1` service in a viewer's browser. OBS can composite this local source alongside a StreamElements alert source in the same scene.
