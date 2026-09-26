# Verificación

## Automatizada

```powershell
node --test tests/*.test.mjs
node scripts/check.mjs
```

La suite de interfaz requiere `ffmpeg`, `ffprobe` y Playwright, instalado fuera del código distribuido o como dependencia local sin guardar. Podés usar:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/ui.mjs
node tests/usage.mjs
```

Con una instalación existente, definir `PLAYWRIGHT_MODULE` como ruta absoluta al módulo `playwright/index.mjs` y opcionalmente `CW_TEST_BROWSER` como ruta de Chrome/Chromium. La prueba usa un navegador aislado y un servidor efímero en loopback. No se conecta a Codex.

Se generan PNG/video sintéticos en `test-results`, se importan con el código real y se verifican biblioteca vacía, filtros, texto no ejecutable, imagen/video, dimensiones, paleta, superficies, preferencia de movimiento reducido, dos ventanas, sincronización por storage, rechazo de medio corrupto y restauración al disponer el runtime. La regresión de memoria crea un catálogo con archivos grandes no seleccionados y comprueba que el renderer recibe solamente el archivo solicitado. Otra prueba confirma que una ventana oculta no solicita el fondo completo hasta hacerse visible. Los screenshots generados no se publican como wallpapers.

## Windows

`windows/install.ps1 -Check` verifica paquete oficial, Node, compilador e icono. El instalador acepta `-InstallRoot <carpeta-de-prueba>\app -ShortcutRoot <carpeta-de-prueba>\shortcuts` para compilar y comprobar un acceso sin colocarlo en Inicio. No ejecutar ese acceso si no se quiere abrir Codex.

## Prueba manual de una versión candidata

- Arranque desde el acceso personalizado con biblioteca vacía; la app debe permanecer normal y ofrecer Fondos en el perfil.
- Importación local, selección, cierre normal y reapertura conservando ajustes.
- Nuevo chat vacío, texto escrito, respuesta en curso y Configuración: geometría y esquinas correctas.
- Abrir otra ventana con Ctrl+Shift+N; comprobar la carga automática y el cambio de selección en ambas.
- Monitor con otra resolución/escala, ventana estrecha y sidebar abierta/cerrada: sin deformación ni controles tapados.
- Archivo corrupto y versión incompatible: app abierta, sin bucle de reinicio, estado del fallo comprensible.
- Acceso anclado: icono nítido, agrupación correcta y apertura de la misma aplicación oficial.

La suite automatizada no demuestra por sí sola compatibilidad con una versión nueva de Codex. El primer lanzamiento distribuible sigue en preview hasta completar este recorrido en una instalación limpia. No reiniciar una sesión del usuario para completar esta lista sin pedir permiso.

En Codex oficial 26.924.1866.0 se verificaron en una sesión activa: carga de video e imagen con transferencia bajo demanda, reproducción de video, biblioteca de 17 medios locales, apertura del selector desde el menú de perfil, superficie de sidebar y encabezado, e indicador de uso sobre la ayuda con el acento del fondo. Esta prueba no cubre una instalación limpia ni un arranque en frío desde el acceso distribuible.

## Capturas de documentacion

`node scripts/showcase.mjs <manifest-local.json>` renderiza el runtime real sobre una interfaz de demostración. El manifest es un array de `{file,title,slug,source}` y debe quedar fuera de Git. Las fotos resultantes van a `docs/assets`; los originales y la biblioteca temporal quedan fuera del código instalado. Revisar cada captura antes de publicarla y registrar sus fuentes. Los enlaces de idioma de los README cambian la documentación; la interfaz distribuida del selector permanece en inglés.

`tests/usage.mjs` usa una consulta nativa simulada y reloj controlado para verificar suscripciones, refresco cada 30 segundos, pausa en segundo plano, expiracion de datos, idioma y limpieza. No accede a ninguna cuenta.
