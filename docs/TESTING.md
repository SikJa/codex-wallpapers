# Verificación

## Codex 26.928.3736.0

The official package retains the main surface, profile-menu labels, thread footer and `rate-limit-status` query contracts. Isolated library, preference restore, UI, footer transparency and automatic usage-refresh suites pass. Live startup verification is pending at preparation time; the controlled restart runs outside Codex's process tree and checks restored media, disk selection, sidebar usage and OBS consistency.

## Codex 26.928.2636.0 and disk preferences

The official package retains the main shell and native profile and rate-limit query contracts. Isolated tests recover the selected media in a fresh browser context with empty localStorage, using `preferences.json` in the local library folder. Unit tests prevent an older window checkpoint from overwriting newer settings and cover a malformed backup. Existing browser preferences migrate on startup; the listener checkpoints changes every two seconds.

An authorized restart was executed by an independent Windows scheduled task with a one-use lock. The real 26.928.2636.0 process restored the existing selected image and appearance settings; the disk backup matched the renderer's selection. The sidebar orb and OBS source returned the same native remaining percentage and reset timestamp. The user confirmed that personalization returned. The local metrics preview had not yet received its scan at that verification point, and clean-install validation remains pending.

## Codex 26.928.1915.0

The installed official ASAR retains `main[data-app-shell-main-surface]`, the profile footer labels and the native `rate-limit-status` query (both one-part polling and account-scoped SSE keys). Image-generation queries share that prefix and may also contain rate limits; the regression test now supplies such a payload with a newer timestamp to verify it cannot replace account usage.

After an authorized restart, the user confirmed the live personalization. The local OBS source was then checked in isolated Chrome at its configured canvas size: it rendered the native remaining percentage, animated orb and reset countdown with a transparent canvas. The server runs as a limited interactive scheduled task, independent of Codex's process tree. This verifies the browser source; final composition inside OBS and clean-install validation remain separate checks.

## Automatizada

```powershell
node --test tests/*.test.mjs
node scripts/check.mjs
npm run typecheck
npm run build:usage
```

La suite de interfaz requiere `ffmpeg`, `ffprobe` y Playwright, instalado fuera del código distribuido o como dependencia local sin guardar. Podés usar:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/ui.mjs
node tests/usage.mjs
node tests/usage-panel.mjs
```

Con una instalación existente, definir `PLAYWRIGHT_MODULE` como ruta absoluta al módulo `playwright/index.mjs` y opcionalmente `CW_TEST_BROWSER` como ruta de Chrome/Chromium. La prueba usa un navegador aislado y un servidor efímero en loopback. No se conecta a Codex.

Se generan PNG/video sintéticos en `test-results`, se importan con el código real y se verifican biblioteca vacía, filtros, texto no ejecutable, imagen/video, dimensiones, paleta, superficies, preferencia de movimiento reducido, dos ventanas, sincronización por storage, rechazo de medio corrupto y restauración al disponer el runtime. La regresión de memoria crea un catálogo con archivos grandes no seleccionados y comprueba que el renderer recibe solamente el archivo solicitado. Otra prueba confirma que una ventana oculta no solicita el fondo completo hasta hacerse visible. Los screenshots generados no se publican como wallpapers.

## Windows

`windows/install.ps1 -Check` verifica paquete oficial, Node, compilador e icono. El instalador acepta `-InstallRoot <carpeta-de-prueba>\app -ShortcutRoot <carpeta-de-prueba>\shortcuts` para compilar y comprobar un acceso sin colocarlo en Inicio. No ejecutar ese acceso si no se quiere abrir Codex.

## Prueba manual de una versión candidata

- Arranque desde el acceso personalizado con biblioteca vacía; la app debe permanecer normal y ofrecer Wallpapers en el perfil.
- Importación local, selección, cierre normal y reapertura conservando ajustes.
- Nuevo chat vacío, texto escrito, respuesta en curso y Configuración: geometría y esquinas correctas.
- Abrir otra ventana con Ctrl+Shift+N; comprobar la carga automática y el cambio de selección en ambas.
- Monitor con otra resolución/escala, ventana estrecha y sidebar abierta/cerrada: sin deformación ni controles tapados.
- Archivo corrupto y versión incompatible: app abierta, sin bucle de reinicio, estado del fallo comprensible.
- Acceso anclado: icono nítido, agrupación correcta y apertura de la misma aplicación oficial.

La suite automatizada no demuestra por sí sola compatibilidad con una versión nueva de Codex. El primer lanzamiento distribuible sigue en preview hasta completar este recorrido en una instalación limpia. No reiniciar una sesión del usuario para completar esta lista sin pedir permiso.

En Codex oficial 26.924.1866.0 se verificaron carga de video e imagen con transferencia bajo demanda, reproducción de video, apertura del selector desde el menú de perfil, cierre mediante la X, superficies translúcidas de sidebar y encabezados, e indicador de uso sobre la ayuda. Se cerró por completo el proceso anterior y se abrió desde el lanzador personalizado: el proceso nuevo expuso un endpoint local con identidad verificada y restauró el tema y el video. Una ventana nueva también cargó biblioteca, tema, medidor y video al quedar visible. El acceso volvió a activar la ventana cuando el proceso ya estaba abierto. Esta prueba usa una instalación y biblioteca existentes; **no** cubre una instalación limpia para otra persona.

En Codex oficial 26.924.2738.0 se confirmó que la versión no admitida abría Codex normal. Tras pasar las suites aisladas y añadir la versión, un arranque completo desde el lanzador anclado creó un proceso con endpoint local verificado; cargó la biblioteca existente, reprodujo un video 1920 × 1080 y mostró el selector de 17 medios y el indicador de uso. Volver a abrir el acceso anclado activó el mismo proceso, sin iniciar otro. Sigue pendiente probar una instalación limpia en otra PC.

## Capturas de documentacion

`node scripts/showcase.mjs <manifest-local.json>` renderiza el runtime real sobre una interfaz de demostración. El manifest es un array de `{file,title,slug,source}` y debe quedar fuera de Git. Las fotos resultantes van a `docs/assets`; los originales y la biblioteca temporal quedan fuera del código instalado. Revisar cada captura antes de publicarla y registrar sus fuentes. Los enlaces de idioma de los README cambian la documentación; la interfaz distribuida del selector permanece en inglés.

`tests/usage.mjs` usa una consulta nativa simulada y reloj controlado para verificar suscripciones, refresco cada 30 segundos, pausa en segundo plano, expiracion de datos, idioma y limpieza. No accede a ninguna cuenta.

`tests/usage-local.test.mjs` usa sesiones sintéticas para comprobar deltas de tokens, rachas, duración, actualización de archivos y descarte de archivos eliminados. `tests/usage-panel.mjs` monta el panel en Chrome aislado para comprobar nombre/plan nativos, foto elegida con `+`, métricas locales, celdas interactivas, enlace a Uso y limpieza. Ninguna de estas pruebas lee la cuenta ni las sesiones reales del usuario. [Alcance de los datos](USAGE.md).
