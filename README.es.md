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

## Empezar

Necesitás Codex Desktop para Windows, Node.js 22+ y FFmpeg/ffprobe para importar archivos. Desde este repo, ejecutá:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\install.ps1
```

Abrí **Codex Wallpapers** desde Inicio la próxima vez que abras Codex. Anclá **ese acceso** a la barra de tareas: usa el icono oficial de tu instalación y abre la misma app con la personalización. El acceso original sigue disponible. [Detalle del acceso y el icono](docs/WINDOWS.md).

Adjuntale una imagen o un video a tu agente en Codex y pedile:

> Importá este fondo en codex-wallpapers, conservá el original y comprobá su resolución. No reinicies Codex sin preguntarme.

Después elegilo en **Perfil → Wallpapers**. La biblioteca empieza vacía. Recomendamos **Wallpaper Engine en Steam** como fuente: usá una imagen o video local que tengas permiso de usar. Las escenas del Workshop necesitan una imagen o un video grabado/exportado. [Guía de medios](docs/MEDIA.md).

## Seguridad y estado

**Proyecto independiente y experimental.** Aplica CSS/JavaScript mediante depuración local de Electron. No es un plugin oficial ni está aprobado por OpenAI; no se garantiza compatibilidad ni ausencia de restricciones sobre la cuenta. [Seguridad y alcance](docs/SECURITY.md).

**Preview:** pasaron las pruebas aisladas de transferencia, interfaz y acceso de Windows. La biblioteca completa ya no se copia dentro de cada renderer. Falta validar manualmente el arranque en una instalación limpia. Si la personalización falla, Codex queda abierto; el proyecto nunca lo reinicia para recuperarse.

[Guía del agente](docs/AGENT.md) · [Actualizaciones](docs/UPDATES.md) · [Pruebas](docs/TESTING.md) · [Licencia MIT del código](LICENSE)
