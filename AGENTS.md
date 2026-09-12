# Instrucciones para agentes

Leé README.md y docs/AGENT.md antes de instalar o importar.

- La interfaz distribuida debe estar en inglés: botón "Wallpapers", modal, ayuda, estados, errores e indicador de uso, independientemente del idioma de Codex. Conservar los selectores de menús nativos en otros idiomas para compatibilidad.

- Alcance: wallpapers, selector Perfil > Fondos, apariencia y el indicador de uso solicitado. Mantener los efectos del compositor fuera de este proyecto.
- La biblioteca inicial debe estar vacía. Nunca incluir medios, datos de cuenta, rutas personales, registros o archivos de una instalación local en Git.
- No cerrar, matar, recargar ni reiniciar Codex sin autorización explícita para esa acción. Una autorización para instalar o importar no implica autorización para reiniciar.
- Ante un fallo, dejar Codex abierto. Nunca crear bucles de reinicio, modificar el paquete instalado o reemplazar binarios de Codex.
- No reutilizar endpoints encontrados al azar. Aplicar únicamente tras verificar identidad del paquete, propietario del puerto, loopback e identidad del navegador.
- Si hay otro mod activo, detener la instalación y explicar la incompatibilidad. No desinstalarlo automáticamente ni aplicar este runtime encima.
- Conservar el archivo original. Importar por CLI a la biblioteca local; respetar las licencias de medios. No ejecutar archivos HTML, EXE, JS o PKG del Workshop.
- Mantener el diseño nativo del nuevo chat. No fijar posiciones del compositor que tapen las sugerencias.
- El botón Fondos pertenece al menú de perfil debajo de Configuración; nunca a la esquina superior de la ventana.
- No ampliar la lista de versiones compatibles sin evidencia y pruebas. Distinguir pruebas aisladas de validación real en Codex.
- Las capturas de documentacion pueden usar contenido de demostracion y arte propio, bajo docs/assets. No publicar fondos personales, conversaciones reales, iconos oficiales o ejecutables compilados.
