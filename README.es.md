<p align="center">
  <a href="README.md"><img src="docs/assets/language-en.svg" alt="English"></a>
  <a href="README.es.md"><img src="docs/assets/language-es.svg" alt="Español"></a>
  <a href="README.pt-BR.md"><img src="docs/assets/language-pt.svg" alt="Português do Brasil"></a>
</p>

![Codex Wallpapers — Tu espacio. Tu Codex.](docs/assets/hero.jpg)

**Hacé de Codex un espacio más tuyo.** Elegí una imagen o un video y dejá que los colores lo acompañen. Cambiá de fondo desde **Perfil → Wallpapers** y ajustá brillo, transparencia y esquinas.

## La misma interfaz. Otro ambiente.

Estas vistas previas usan fondos de una colección personal y contenido de ejemplo. El acento, la sidebar y el compositor toman sus colores de cada fondo: compará las muestras de paleta debajo del mensaje. Hacé clic en una imagen para verla en grande.

| Glass Ribbons | MacOS Style |
| :---: | :---: |
| [![Glass Ribbons](docs/assets/gallery-glass-ribbons.jpg)](docs/assets/gallery-glass-ribbons.jpg) | [![MacOS Style](docs/assets/gallery-macos-style.jpg)](docs/assets/gallery-macos-style.jpg) |
| **MacOs M3** | **Mac Baconai** |
| [![MacOs M3](docs/assets/gallery-macos-m3.jpg)](docs/assets/gallery-macos-m3.jpg) | [![Mac Baconai](docs/assets/gallery-mac-baconai.jpg)](docs/assets/gallery-mac-baconai.jpg) |
| **Red Torii** | **CHR0NIC** |
| [![Red Torii](docs/assets/gallery-red-torii.jpg)](docs/assets/gallery-red-torii.jpg) | [![CHR0NIC](docs/assets/gallery-chronic.jpg)](docs/assets/gallery-chronic.jpg) |

La galería muestra ejemplos; los fondos no vienen incluidos. [Créditos de los fondos](docs/assets/README.md).

## Tu colección, a un clic

![Selector de fondos con búsqueda, vistas previas y ajustes de apariencia](docs/assets/picker.jpg)

- **Tus archivos:** JPG, PNG, WebP, MP4 y WebM. Los videos se repiten sin sonido.
- **Tus colores:** paleta automática o manual, opacidad y esquinas ajustables.
- **Tu espacio:** encuadre sin estirar, preferencias guardadas y soporte para varias ventanas.
- **Memoria controlada:** cada ventana recibe las miniaturas del catálogo y solamente el fondo completo que está usando. Las ventanas ocultas esperan antes de cargar animaciones.
- **Vista de uso:** el indicador muestra tokens oficiales de la cuenta, máximo diario, tarea más larga, rachas e historial. El límite y reinicio vienen de la consulta nativa. Elegí tu foto local con `+`. [Origen de los datos](docs/USAGE.md).

Este repositorio contiene únicamente la personalización de Codex. Los overlays de streaming para OBS son un proyecto separado: no se instalan ni se inician desde acá.

## Empezar

Necesitás Codex Desktop para Windows, Node.js 22+ y FFmpeg/ffprobe para importar archivos. Desde este repo, ejecutá:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\install.ps1
```

Abrí **Codex Wallpapers** desde Inicio la próxima vez que abras Codex. Anclá **ese acceso** a la barra de tareas: usa el icono oficial de tu instalación y abre la misma app con la personalización. El acceso original sigue disponible. [Detalle del acceso y el icono](docs/WINDOWS.md).

Adjuntale una imagen o un video a tu agente en Codex y pedile:

> Importá este fondo en codex-wallpapers, conservá el original y comprobá su resolución. No reinicies Codex sin preguntarme.

Después elegilo en **Perfil → Wallpapers**. La biblioteca empieza vacía. Recomendamos **Wallpaper Engine en Steam** como fuente: usá una imagen o video local que tengas permiso de usar. Las escenas del Workshop necesitan una imagen o un video grabado/exportado. [Guía de medios](docs/MEDIA.md).

## Cómo funciona el Codex personalizado

El acceso **Codex Wallpapers** abre la aplicación oficial instalada en Windows. No instala otro Codex ni reemplaza sus archivos. Antes de aplicar el tema, inspecciona la interfaz instalada, abre una conexión de depuración limitada a esta PC y comprueba que pertenece al proceso oficial. Después carga el fondo, el selector y el indicador de uso. Un auxiliar acompaña esa sesión para guardar cambios y atender ventanas nuevas; no es un servicio que reinicie Codex cuando algo falla.

Si abriste Codex desde el icono original, abrir luego el acceso personalizado no transforma esa instancia: activa la ventana existente. Cerrá Codex normalmente cuando termines y abrilo desde **Codex Wallpapers**. Anclar el icono original puede volver a abrirlo sin tema; comprobá el destino del acceso anclado.

Si una actualización cambia la interfaz y falla la comprobación, Codex abre normal. La comprobación automática no puede adaptar código a cualquier cambio futuro. El botón nativo de reinicio por actualización tiene un traspaso independiente y limitado; su alcance y las pruebas pendientes están en [Actualizaciones](docs/UPDATES.md).

## Importar, guardar y recuperar tus fondos

En **Perfil → Wallpapers**, activá **Shuffle wallpapers → On** y elegí **Change every (minutes)** entre 1 y 1440 minutos (5 por defecto). Rota al azar entre todos los fondos importados sin repetir inmediatamente el actual. Con menos de dos fondos espera; **Off** cancela la rotación y conserva el fondo actual. También se pausa al ocultar la ventana o desactivar el fondo. Al volver, espera un intervalo completo. El modo y el intervalo se guardan junto con las preferencias. El auxiliar de la sesión personalizada debe estar activo para cargar cada nuevo medio.

Desde la carpeta del repositorio, con Node, FFmpeg y ffprobe disponibles:

```powershell
node .\src\cli.mjs data-dir
node .\src\cli.mjs import "C:\Fondos\mi-fondo.mp4" --title "Mi fondo"
node .\src\cli.mjs list
```

La importación copia el archivo a la biblioteca y genera una miniatura y una paleta; conserva el original. En la siguiente apertura personalizada, elegí el archivo desde **Perfil → Wallpapers**. Los controles del proyecto están en inglés, aunque Codex esté en español. Para incorporar la biblioteca a una sesión ya abierta, seguí la [guía del agente](docs/AGENT.md): requiere verificar primero la conexión existente.

| Qué se guarda | Dónde, por defecto |
| --- | --- |
| Código instalado y lanzador | `%LOCALAPPDATA%\CodexWallpapers\app` |
| Biblioteca, medios y preferencias | `%LOCALAPPDATA%\CodexWallpapers` |
| Tu copia de desarrollo | La carpeta donde clonaste este repo |

`CODEX_WALLPAPERS_DATA` permite elegir otra carpeta de datos. Importar y arrancar deben usar la misma carpeta. La selección y los ajustes se guardan en disco y se restauran al abrir una sesión personalizada; el almacenamiento del navegador no es la única copia. Un medio inválido no debe reemplazar un fondo que ya funciona. Los videos se reproducen sin sonido y respetan movimiento reducido.

Para hacer un respaldo, copiá la carpeta de datos, incluidos biblioteca, medios y preferencias. Los fondos y la foto local no se suben a GitHub. Otra persona empieza con su propia biblioteca vacía y sus datos de cuenta; las imágenes de la galería no se instalan.

## Actualizar e iniciar con Windows

**Actualizar Codex, actualizar este repo y actualizar la copia instalada son pasos distintos.** `git pull` trae el código al clon; no reemplaza `%LOCALAPPDATA%\CodexWallpapers\app`. Para actualizar una instalación existente, respaldá datos y seguí [la actualización conservando medios](docs/UPDATES.md). No ejecutes el instalador encima de una instalación existente.

El instalador crea el acceso en Inicio; **no habilita automáticamente el inicio de Windows**. Si lo querés, copiá el acceso personalizado a la carpeta que abre `shell:startup` y verificá que esté habilitado en Aplicaciones de inicio de Windows.

| Problema | Qué comprobar |
| --- | --- |
| Abre sin personalización | Acceso usado, instancia anterior abierta y logs de compatibilidad en la carpeta de datos. |
| No aparece Wallpapers o el uso | Versión del código instalado y reconocimiento del menú de perfil; se admite «Abrir menú del perfil». |
| No recuerda el fondo | Misma carpeta de datos al importar y arrancar, permisos de escritura y existencia del medio guardado. |

No borres preferencias ni locks para probar suerte. Primero comprobá qué proceso los usa y consultá [diagnóstico y recuperación](docs/UPDATES.md).

## Seguridad y estado

**Proyecto independiente y experimental.** Aplica CSS/JavaScript mediante depuración local de Electron. No es un plugin oficial ni está aprobado por OpenAI; no se garantiza compatibilidad ni ausencia de restricciones sobre la cuenta. [Seguridad y alcance](docs/SECURITY.md).

**Preview:** pasaron las pruebas aisladas de transferencia, interfaz y acceso de Windows. La biblioteca completa ya no se copia dentro de cada renderer. Falta validar manualmente el arranque en una instalación limpia. Si la personalización falla, Codex queda abierto; el proyecto nunca lo reinicia para recuperarse.

[Guía del agente](docs/AGENT.md) · [Actualizaciones](docs/UPDATES.md) · [Pruebas](docs/TESTING.md) · [Licencia MIT del código](LICENSE)
