# Actualizaciones y recuperación

La compatibilidad se limita a versiones explícitas del paquete de Windows. Una actualización de Codex puede cambiar los selectores o el comportamiento del renderer. El acceso abre Codex normal si la versión no está admitida o el preflight falla. Si el fallo ocurre después de abrir, la app queda abierta, sin reintentos de reinicio.

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
