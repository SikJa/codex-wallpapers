# Cambios

## Console-free OBS startup

- Compile a local WinExe launcher that starts Node with `CreateNoWindow`, redirects logs to files and prevents duplicate instances with a mutex.
- Use that launcher for the scheduled task and login shortcut. `-WindowStyle Hidden` alone can still leave a visible Windows Terminal window on systems using it as the default console host.
- Keep the same local overlay URL and preserve the independent lifetime of the OBS server.

## Codex 26.928 compatibility

- Add Windows 26.928.1915.0 after inspecting the official package's shell, profile-menu and native usage query contracts, with isolated runtime tests.
- Exclude image-generation limit queries even when they contain a rate-limit payload; only account usage feeds the sidebar and OBS percentage.
- Recover the OBS data connection within the next 5-second poll when Codex becomes available, while retaining the 45-second polling cadence for a connected app.
- Launch the local OBS server through a limited, interactive Task Scheduler task so it does not inherit Codex's process lifetime. The existing login shortcut continues to start it automatically.
- Live 26.928 usage verified: the transparent browser source renders the same native remaining percentage and reset countdown as the app. Clean-install validation remains pending; an unsupported version still opens Codex normally.

## 0.1.6 — Preview

- Stop copying the entire wallpaper library into every Codex renderer.
- Send lightweight metadata and thumbnails first, then transfer only the wallpaper selected by that window.
- Release the previous full-size media object after a successful switch and defer animated media while a window is hidden.
- Add a regression test proving that unselected media files are never read or transferred to the renderer.

## 0.1.5 — Preview

- Refresh the usage badge from the current account-scoped native rate-limit query.
- Ignore model-specific image-generation queries so the badge reflects Codex usage.
- Keep the badge in English and refresh it as native usage data changes.

## 0.1.4 — Preview

- Add Codex Windows 26.917.8451.0 after checking native shell, profile-menu and usage-query markers in the official package.
- Keep the local wallpaper picker and account usage badge compatible with the current shell markers.
- Isolated tests pass; clean-install manual validation remains pending.

## 0.1.3 — Preview

- Add Codex Windows 26.911.7940.0 after checking native shell, profile-menu and usage-query markers in the official package.
- Preserve English UI, adaptive palettes, rounded surfaces and automatic usage refresh.
- Isolated UI and launcher tests pass; clean-install manual validation is still required.

## 0.1.2 — Preview

- Add Codex Windows 26.908.9136.0 to the preview compatibility list after checking native shell, profile and usage markers.
- Select an available loopback port when the preferred port is occupied; keep package and browser identity verification.
- English wallpaper menu, dialog, help and usage labels.
- Add an isolated occupied-port regression check. Clean-install manual validation remains pending.

## 0.1.1 — Preview

- Portada visual y galería con seis fondos y sus paletas reales.
- Guías de inicio en inglés, español y portugués de Brasil.
- Detección de color destacado y miniaturas de video después del primer segundo.
- Indicador de uso conectado a la consulta nativa, con refresco automático.

## 0.1.0 — Preview

- Runtime independiente por ventana para fondos locales y apariencia configurable.
- Biblioteca vacía, importación por agente/CLI, integridad SHA-256 y cambio transaccional de medios.
- Menú Perfil > Fondos, selector negro y ajustes compartidos entre ventanas.
- Acceso de Windows con icono obtenido localmente e identidad del paquete oficial.
- Fallback a apertura normal y errores sin cerrar/reiniciar Codex.
