# Codex usage and rotating banner in OBS

Two Browser Sources share the same local server:

| Source | URL | Initial OBS dimensions |
| --- | --- | --- |
| Usage orb and reset countdown | `http://127.0.0.1:8794/` | 300 × 100 |
| Camera frame, rotating banner and usage | `http://127.0.0.1:8794/camera-overlay?variant=lift` | 400 × 500 |
| Interactive preview | `http://127.0.0.1:8794/camera-preview?variant=lift` | Open in a browser |

The camera output leaves a transparent opening for your existing OBS camera source. The preview uses a neutral placeholder. They use the **same renderer**, including the lift animation, dark translucent cards, centered social icons and border beams that disappear while cards cross. The banner expands below the usage card every eight seconds. Reduced motion disables automatic position changes and beam animation.

Build and start the local overlay on Windows:

```powershell
npm ci
npm run build:obs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\start-obs-overlay.ps1 -InstallStartup
```

`-InstallStartup` creates a user Startup shortcut. The console-free helper runs independently of Codex through a Windows task and does **not** open or restart Codex. Launchers resolve Node 22+ from PATH, the current user's Codex runtime, or Program Files. If the data directory is custom, add `-DataRoot "C:\path\to\data"`. The server binds only to `127.0.0.1:8794`; `CW_OBS_PORT` can override that port.

Add the chosen URL as an OBS **Browser Source**, with a transparent background. Place the camera source underneath the camera overlay, align both, and group them before resizing. For explicit camera geometry, use `?variant=lift&cameraWidth=318&cameraHeight=313&x=41&y=8`. The values refer to the camera rectangle inside the Browser Source canvas; leave room below for both cards and their motion. With no geometry parameters, the complete composition scales to fit the source dimensions above.

This is a local OBS source, separate from the overlays in your StreamElements dashboard. Add the local URL directly to OBS; OBS composites it with any StreamElements alert source in the same scene. Viewers see the resulting video, not the local URL.

## Live data

The server reads `account/rateLimits/read` from the locally installed official Codex engine using a short-lived app-server process. It uses the existing local sign-in; it does not copy credentials, initiate login, send prompts or require the personalized window/CDP endpoint. The Codex app must have provisioned its engine under the current user's local application data.

Remaining percentage and reset belong to the **most consumed Codex quota window**, which can be primary or secondary. Image-generation limits are excluded. Polling is bounded to once every 45 seconds, including failures; the source checks the cached result every ten seconds and updates the countdown every minute. Missing/failed data shows an unavailable state, never a sample percentage. Cached results older than two minutes are hidden. The standalone source uses a neutral accent rather than reading the wallpaper palette from a running window.

## Private messages and social links

Create `camera-config.json` in the data directory (by default `%LOCALAPPDATA%\CodexWallpapers`). Refresh the OBS browser source after editing:

```json
{
  "bannerMessages": ["Follow for the next stream", "Use $ to talk to your bot"],
  "socials": [
    {"network": "youtube", "handle": "@your-channel"},
    {"network": "discord", "handle": "discord.gg/your-invite"}
  ],
  "messageDuration": 12,
  "priorityMessage": "Use $ to talk to your bot",
  "priorityDuration": 24
}
```

Supported networks: `youtube`, `instagram`, `x`, `discord`. Messages and handles are plain text, up to 160 characters. Durations accept 3–120 seconds. The exact priority message stays visible longer, independently of the card-position timer. No personal handles, photos or messages ship with the repository. Missing configuration uses one generic message; malformed configuration reports an error.

Existing private `camera-preview` or `camera-overlay` directories containing `index.html` continue to override that route as a complete set. This protects older custom installations; they **do not automatically receive** the shared renderer. Back up and move those overrides out of the data directory when deliberately migrating to the built-in renderer. Merely updating this repository does not replace a separately deployed server or refresh a running OBS source.

## Verification

`node tests/obs-camera.mjs` starts an isolated server and browser, with synthetic quota and a private temporary configuration. It checks preview/capture geometry, both swap directions, Discord centering, beam suppression, reduced motion and private override isolation. It never connects to OBS or restarts Codex. Set `PLAYWRIGHT_MODULE` or `CW_TEST_BROWSER` if using an external Playwright installation or browser.
