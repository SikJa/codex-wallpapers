# Flujo del agente

## Preparar

1. Leer las instrucciones y comprobar Windows, Node y el paquete oficial con `windows/install.ps1 -Check`.
2. Explicar que se trata de una modificación experimental mediante depuración local, no de un plugin oficial.
3. Inspeccionar si existe una instalación previa. El instalador rechaza sobrescribir accesos o carpetas existentes.
4. Instalar con autorización del usuario. No cerrar la app: la primera apertura personalizada la hace el usuario cuando decida, o el agente con autorización específica.

## Importar un archivo adjunto

1. Obtener la ruta real del adjunto. Admitidos: JPG, PNG, WebP, MP4 y WebM. Si es una escena, explicar las alternativas de docs/MEDIA.md.
2. Ejecutar `node src/cli.mjs import <ruta> --title <nombre>` usando argumentos estructurados o quoting adecuado para el shell. No construir comandos con texto del usuario sin escapar.
3. El importador conserva el original, verifica tamaño/códec/resolución, calcula hash, genera miniatura y paleta y escribe la biblioteca atómicamente. `ffmpeg` y `ffprobe` deben estar disponibles; no descargar herramientas sin autorización.
4. Ejecutar `node src/apply.mjs` solo si el acceso personalizado ya creó una sesión válida. Actualiza todos los documentos principales abiertos. Si no existe endpoint válido, conservar el archivo importado e informar que se cargará al abrir desde el acceso.
5. Informar el nombre, dimensiones y cualquier ampliación o recorte. El usuario elige en perfil → Fondos. No prometer nitidez que el original no tenga.

Después de instalar, también se puede usar la CLI de `%LOCALAPPDATA%\CodexWallpapers\app\src`; los archivos del clon y la instalación son copias diferentes. Las importaciones se guardan en el mismo directorio de datos por defecto.

## Probar

Usar `CODEX_WALLPAPERS_DATA` apuntando a una carpeta de pruebas para no contaminar una biblioteca real. No usar la app activa como navegador de pruebas. Ejecutar los controles pertinentes de docs/TESTING.md y comunicar qué quedó pendiente de validación humana.

## Recuperación

Una importación inválida no debe cambiar la selección anterior. Un error de aplicación inicial debe retirar las capas incompletas. No borrar locks automáticamente: inspeccionar si su proceso sigue activo; un lock obsoleto se resuelve de forma explícita. Nunca cerrar ni reiniciar Codex para forzar una aplicación.
