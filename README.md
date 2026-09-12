# Codex Wallpapers

Fondos propios y una apariencia que acompaña al fondo en Codex Desktop para Windows. Abrí tu **perfil → Fondos**, debajo de Configuración, para elegir un fondo y ajustar el aspecto. La biblioteca viene **vacía**.

**Proyecto experimental e independiente. No es un plugin oficial ni está aprobado por OpenAI.** Utiliza el puerto de depuración local de Electron para aplicar CSS y JavaScript en memoria. Una actualización puede romper la compatibilidad; no podemos garantizar que este método esté permitido por las condiciones del servicio ni que esté libre de restricciones sobre la cuenta. No lo instales si necesitás esa garantía. Ver [seguridad y límites](docs/SECURITY.md).

## Qué incluye

- Imágenes JPG, PNG y WebP; videos MP4 y WebM sin sonido.
- Selector negro con búsqueda, filtros, vista previa y biblioteca propia.
- Paleta automática basada en el fondo, o colores manuales.
- Brillo, opacidad de superficies, movimiento y esquinas configurables.
- Sidebar, compositor y Configuración redondeados; Configuración conserva el fondo negro.
- Nuevo chat conserva su distribución original y las sugerencias tienen transparencia ajustable.
- Encuadre sin deformación: llenar recorta bordes; completo puede mostrar franjas.
- Preferencias compartidas entre ventanas y aplicación en ventanas nuevas, incluido Ctrl+Shift+N.
- Acceso directo de Windows con identidad de Codex e icono oficial obtenido de la instalación local.

No incluye efectos en enviar/detener, halos, contador de uso, fondos de otros usuarios, iconos oficiales redistribuidos ni integración con la cuenta de Steam. No modifica los archivos de instalación de Codex, sus conversaciones o credenciales. Sí agrega archivos locales, un acceso directo y preferencias propias.

## Instalación

Requisitos: Windows 10/11, Codex Desktop instalado desde Microsoft Store, **Node.js 22 o posterior**, y `ffmpeg`/`ffprobe` en PATH para importar medios. No hay dependencias npm de ejecución. La versión candidata figura en [compatibility.json](compatibility.json); otras versiones se abren con aspecto normal.

Pedile al agente que lea [AGENTS.md](AGENTS.md) y [la guía del agente](docs/AGENT.md). También podés ejecutar desde PowerShell, ubicado en este repo:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\install.ps1 -Check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\install.ps1
```

El instalador crea **Codex Wallpapers** en Inicio. No abre ni cierra Codex. Guardá lo que estés haciendo, cerrá Codex normalmente cuando quieras y abrilo desde ese acceso. Si Codex ya estaba abierto, el lanzador lo deja intacto: no se conecta a una sesión normal ni la reinicia.

**Para la barra de tareas**, leé [acceso directo e icono](docs/WINDOWS.md). Anclar el acceso original puede hacer que Codex arranque sin personalización.

## Agregar y cambiar fondos

Adjuntá un archivo local en Codex y pedí:

> Importá este fondo en codex-wallpapers. Conservá el original, comprobá su resolución y cargalo en la biblioteca. No reinicies Codex sin preguntarme.

El agente importa una copia y refresca las ventanas abiertas. Después cambiás de fondo vos mismo en **perfil → Fondos**; no necesitás abrir una página ni levantar un servidor manualmente. El auxiliar de ventanas funciona en segundo plano mientras esa sesión de Codex está abierta.

Recomendamos **Wallpaper Engine en Steam como fuente**, cuando el autor permita usar el medio. Las escenas de Wallpaper Engine no son videos: un `scene.pkg` requiere su motor. Este proyecto no ejecuta escenas ni scripts del Workshop. Usá una imagen base o un video que puedas obtener/exportar o capturar con permiso; los efectos de una escena no aparecen en una imagen estática. Ver [medios y resolución](docs/MEDIA.md).

Para importar manualmente:

```powershell
node .\src\cli.mjs import "D:\Fondos\mi-fondo.mp4" --title "Mi fondo"
node .\src\cli.mjs list
node .\src\apply.mjs
```

`apply.mjs` requiere una sesión abierta por el acceso personalizado. Solo usa su endpoint verificado, no abre Codex. Sin esa sesión, el medio queda guardado para la próxima apertura.

## Estado del proyecto

Versión inicial **0.1.0 preview**. Las pruebas aisladas cubren importación real, integridad, interfaz, cambio transaccional de medios, dos ventanas y preferencias. La identidad del paquete y la compilación del acceso se comprueban en Windows. El instalador distribuible todavía necesita una prueba manual de arranque completo en una instalación limpia; la suite aislada no sustituye esa prueba.

Ver [verificación](docs/TESTING.md), [actualizaciones y recuperación](docs/UPDATES.md) y [seguridad](docs/SECURITY.md). Ningún componente debe cerrar, matar o reiniciar Codex para recuperarse de un fallo.

## Desarrollo

```powershell
node --test tests/core.test.mjs
node scripts/check.mjs
```

Las pruebas de UI requieren Playwright instalado por separado; instrucciones en [TESTING.md](docs/TESTING.md). Los medios de prueba se generan localmente, no vienen en el repo.

Licencia MIT para el código de este proyecto. Las marcas, iconos de Codex y medios importados conservan sus propios derechos.
