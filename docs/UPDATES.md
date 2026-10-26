# Actualizaciones y recuperación

En cada apertura desde el acceso personalizado se inspecciona el paquete oficial instalado. Las versiones nuevas pueden cargar la personalización automáticamente si conservan todos los marcadores requeridos y pasan el preflight local. La lista de versiones registra validaciones anteriores; ya no bloquea por sí sola una versión nueva. La comprobación estática no garantiza compatibilidad visual: el runtime mantiene sus comprobaciones y limpieza ante fallos. Si la inspección o el preflight falla, el acceso abre Codex normal y guarda el motivo en `compatibility-probe.json`. No descarga código, modifica el paquete oficial ni reinicia para reintentar.

Al pulsar el botón nativo que reinicia para instalar una actualización ya descargada, se prepara una tarea de Windows independiente y oculta, sin programación recurrente. Esa tarea sobrevive al cierre de Codex y se elimina al terminar. Espera hasta 15 minutos al cambio del paquete oficial y a la salida de la versión anterior. Si el actualizador abre la nueva versión sin personalización, solicita un cierre normal y la reabre una sola vez desde el lanzador personalizado. Si no sale con el cierre normal, termina una sola vez los procesos exactos de esa nueva instancia. No reintenta reinicios ni cambia el instalador. Guarda biblioteca y preferencias antes del traspaso. Si la nueva interfaz no pasa las comprobaciones, abre normal. El primer clic para descargar conserva su comportamiento nativo; el traspaso se arma al confirmar el reinicio. Las actualizaciones iniciadas fuera de este botón no están cubiertas. No descarga nuevas versiones de este repositorio; cambios incompatibles de interfaz pueden requerir una adaptación del código. Este flujo requiere una sesión abierta desde el acceso personalizado.

## Actualizar este proyecto

El clon y la copia instalada son carpetas distintas. Para actualizar **el código del mod**, desde el clon:

```powershell
git pull --ff-only
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\update-installed.ps1
```

Cerrar Codex normalmente antes, cuando no haya trabajo pendiente. El comando rechaza actualizar si sigue activo el lanzador o listener instalado; nunca cierra procesos. Prepara una copia nueva, recompila el lanzador oculto, conserva el acceso y mueve la instalación anterior a un backup recuperable. No toca la biblioteca, fotos ni preferencias del directorio de datos. Para una instalación en otra ubicación, pasar `-InstallRoot`.

## Qué se restaura automáticamente y qué no

- **Abrir desde Codex Wallpapers:** descubre el paquete actual, inspecciona los marcadores, ejecuta el preflight y restaura la selección guardada. Respeta un fondo desactivado y el shuffle guardado.
- **Actualizar desde el botón reconocido en una sesión personalizada:** prepara el auxiliar independiente antes de permitir el reinicio oficial. La nueva versión se inspecciona **antes de cerrar una instancia abierta por el actualizador**. Si falla, deja esa app abierta y registra `unsupported-update-left-open` o `preflight-failed-left-open`.
- **Abrir el acceso original, Store o un reinicio externo:** no pasa por el lanzador del mod. Cerrar normalmente y abrir Codex Wallpapers permite volver a aplicar el fondo si es compatible. No hay un vigilante que mate la app para forzarlo.
- **Cambio incompatible en la interfaz:** requiere adaptar el mod. Los marcadores estáticos no certifican el aspecto visual ni que el botón de actualización siga siendo reconocible.
- **Nuevo código en GitHub:** no se descarga ni ejecuta automáticamente. Usar el comando anterior. Actualizar Codex y actualizar este repositorio son operaciones distintas.

La versión 0.1.7 mejora el traspaso y la actualización de la copia instalada; no garantiza compatibilidad universal con versiones futuras ni reemplaza el actualizador oficial.

## Si falla

- **Codex abre normal:** revisar versión, `launch.json` y logs. Puede ser el fallback previsto.
- **No aparece Wallpapers:** comprobar que se abrió con el acceso personalizado y que existe el menú de perfil reconocido. No se crea un botón alternativo arriba a la derecha.
- **Falla un medio:** el anterior se conserva si ya estaba funcionando. Revisar formato, hash, tamaño y códec.
- **Ventana nueva sin tema:** consultar `status.json` y `listener-error.log`; no reiniciar la app automáticamente. El listener hace un intento por documento y no insiste ante errores.
- **Lock sobrante:** comprobar si el auxiliar/importador sigue activo antes de retirar un lock. No borrarlo por rutina.

## Desactivar

El botón **Desactivar fondo** deja la biblioteca y preferencias guardadas. Para volver al arranque normal, usar el acceso original en la siguiente apertura. Para retirar la instalación:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\uninstall.ps1
```

El desinstalador mueve su propia carpeta `app` y su acceso a una copia recuperable. No elimina medios ni conversaciones. Una ventana ya personalizada conserva sus capas hasta cerrarse normalmente; el desinstalador no la cierra.

## Node tras mover Windows o el repositorio

Los lanzadores ahora buscan Node en el PATH y, si no está, en el runtime de Codex del usuario actual o en Program Files. No guardan la ruta de otro usuario ni modifican el PATH global. Si no encuentran Node 22+, el acceso de Codex conserva el fallback a la aplicación normal.

