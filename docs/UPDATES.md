# Actualizaciones y recuperación

En cada apertura desde el acceso personalizado se inspecciona el paquete oficial instalado. Las versiones nuevas pueden cargar la personalización automáticamente si conservan todos los marcadores requeridos y pasan el preflight local. La lista de versiones registra validaciones anteriores; ya no bloquea por sí sola una versión nueva. La comprobación estática no garantiza compatibilidad visual: el runtime mantiene sus comprobaciones y limpieza ante fallos. Si la inspección o el preflight falla, el acceso abre Codex normal y guarda el motivo en `compatibility-probe.json`. No descarga código, modifica el paquete oficial ni reinicia para reintentar.

Al pulsar el botón nativo que reinicia para instalar una actualización ya descargada, se prepara un auxiliar independiente y oculto. Espera hasta 15 minutos al cambio del paquete oficial y a la salida de la versión anterior. Si el actualizador abre la nueva versión sin personalización, solicita un cierre normal y la reabre una sola vez desde el lanzador personalizado. Si no sale con el cierre normal, termina una sola vez los procesos exactos de esa nueva instancia. No reintenta reinicios ni cambia el instalador. Guarda biblioteca y preferencias antes del traspaso. Si la nueva interfaz no pasa las comprobaciones, abre normal. El primer clic para descargar conserva su comportamiento nativo; el traspaso se arma al confirmar el reinicio. Las actualizaciones iniciadas fuera de este botón no están cubiertas. No descarga nuevas versiones de este repositorio; cambios incompatibles de interfaz pueden requerir una adaptación del código. Este flujo requiere una sesión abierta desde el acceso personalizado.

## Actualizar este proyecto

1. Guardar la biblioteca y preferencias propias. Leer los cambios antes de aplicar una nueva versión.
2. Cerrar Codex normalmente solo cuando el usuario lo decida o lo autorice expresamente. Comprobar que el auxiliar de esa sesión terminó; no confundirlo con otros procesos Node.
3. Deshabilitar la instalación anterior con `windows/uninstall.ps1`. Mueve el código a una carpeta recuperable y conserva medios.
4. Instalar el código nuevo con `windows/install.ps1` y revisar el acceso anclado si es necesario.
5. Abrir el acceso y validar perfil → Wallpapers, nuevo chat, Configuración y una segunda ventana.

No basta con hacer `git pull` para actualizar la copia instalada. Nunca modificar binarios o recursos del paquete de Codex, ni ampliar `compatibility.json` a ciegas.

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
