# Acceso directo, icono y barra de tareas

El acceso **Codex Wallpapers** inicia un pequeño ejecutable local, compilado como aplicación sin consola. Este ejecutable llama al lanzador PowerShell oculto; el lanzador abre el paquete oficial de Codex con depuración restringida a loopback, verifica el endpoint y deja un auxiliar Node que aplica la apariencia a cada ventana principal.

El auxiliar observa ventanas cada dos segundos. No reinicia procesos. Sale cuando deja de existir la identidad del navegador que abrió el acceso. Si la aplicación del tema falla, Codex permanece abierto; puede quedar con aspecto normal.

## Por qué se usa otro acceso

El acceso original abre Codex normalmente, sin habilitar el mecanismo de personalización. No lo modificamos. Cuando Codex ya está abierto, el acceso personalizado tampoco lo cierra ni cambia su modo de inicio: el lanzador termina con estado `already-open`.

Los dos accesos no son dos instalaciones de Codex. Se lanza el mismo paquete oficial. El ejecutable auxiliar usa el AppUserModelID del paquete, y el `.lnk` también recibe esa identidad, para que Windows agrupe correctamente la ventana.

## Anclarlo

1. Buscar **Codex Wallpapers** en Inicio.
2. Abrir su ubicación y anclar ese acceso a la barra de tareas, usando las opciones disponibles en tu Windows.
3. Si ya había un anclado original que abre sin tema, desanclar ese acceso y anclar el personalizado. No borrar la aplicación original.
4. Si Windows conserva un icono viejo, desanclar y volver a anclar el acceso correcto. El instalador no reinicia Explorer ni modifica la base interna de anclados.

El icono se copia **intacto** desde `app/resources/chatgpt-app-dark.ico` del paquete local de Codex. Conserva los tamaños originales del ICO; no se extrae una miniatura de baja resolución. El repo no distribuye ese icono.

## Archivos

- `%LOCALAPPDATA%\CodexWallpapers\app`: código instalado y ejecutable auxiliar.
- `%LOCALAPPDATA%\CodexWallpapers\media` y `previews`: copias de los medios del usuario.
- `library.json`: catálogo local; `endpoint.json`: identidad del navegador actual.
- `launch.json`, `status.json` y logs del listener: diagnóstico local, excluido de Git.
- Preferencias de la interfaz: clave propia `codex-wallpapers.preferences.v1` en localStorage del renderer de Codex.

`CODEX_WALLPAPERS_DATA` permite usar otro directorio de datos. Para una instalación normal, dejalo sin definir; las pruebas lo usan para aislar sus archivos. La ruta del código se elige con `-InstallRoot`, separada de la ruta de medios.
