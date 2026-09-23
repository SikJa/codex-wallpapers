# Medios, Wallpaper Engine y resolución

La biblioteca viene vacía. Cada usuario aporta medios que tiene derecho a usar. La recomendación de Wallpaper Engine en Steam es una sugerencia de fuente, no una asociación ni una dependencia.

## Qué se puede importar

| Archivo | Resultado |
| --- | --- |
| JPG, PNG, WebP | Imagen de fondo, sin estirar |
| MP4 H.264 | Video en bucle y sin sonido |
| WebM VP8/VP9/AV1 | Video si el renderer de Codex admite el códec |
| Escena o `scene.pkg` de Wallpaper Engine | No se ejecuta; requiere imagen base o captura/exportación autorizada |
| HTML, CSS, JavaScript o EXE | No se ejecuta ni importa como wallpaper |

Un enlace del Workshop no es un archivo importable. El agente necesita un archivo local. El proyecto no descarga elementos de Steam, no accede a credenciales y no extrae automáticamente archivos del Workshop.

Una imagen base de escena pierde partículas, shaders, audio reactivo y movimiento. Para conservar un resultado animado necesitás un video; crear esa captura es una acción separada. No hay un renderizador de escenas de Wallpaper Engine dentro de Codex.

## Nitidez y encuadre

**Llenar sin estirar** conserva proporción y recorta donde sobra imagen. **Completo** conserva toda la imagen y puede dejar franjas. Ninguna opción inventa detalle: un fondo de 1080p puede perder nitidez en una pantalla de mayor resolución o escala de Windows.

La interfaz avisa al seleccionar si el medio requiere ampliación. El CSS se adapta al tamaño de la ventana, al cambio de monitor y al ancho de la sidebar; no fija un ancho tomado de una captura. Si el aviso quedó viejo tras mover la ventana, volvé a seleccionar el fondo para recalcularlo.

El importador copia el archivo sin reducir resolución ni FPS. Para videos muy pesados, pedir al agente una **copia** optimizada a 30 FPS suele ser una opción práctica; nunca convertir encima del original. El límite actual es 128 MiB por archivo. El selector carga metadatos y miniaturas de toda la biblioteca, pero transfiere al renderer solamente el archivo seleccionado. Al cambiar de fondo libera el archivo completo anterior, y una ventana oculta espera hasta ser visible antes de cargar una animación.

La miniatura es una imagen pequeña para el selector; no es el fondo aplicado. La paleta automática detecta una región de color del primer fotograma y adapta acentos y superficies oscuras; los fondos neutros producen una paleta neutra. No cambia a cada fotograma. Brillo y superficies oscuras ayudan a leer, pero los colores manuales requieren comprobación visual.

## Quitar un medio

Esta primera versión permite seleccionar, desactivar y restablecer ajustes desde la UI; todavía no ofrece borrado individual. El agente puede editar una copia del catálogo, retirar la entrada y sus archivos correspondientes con autorización, y conservar una copia de recuperación. La biblioteca completa se recarga al abrir una nueva sesión. No borrar archivos originales de Steam.
