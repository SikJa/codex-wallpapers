# Seguridad y alcance

Este proyecto no está afiliado a OpenAI, Steam o Wallpaper Engine. No hay afirmación de permiso contractual para modificar Codex ni garantía contra restricciones o suspensión. La licencia MIT del código no concede derechos sobre la aplicación de OpenAI ni sobre fondos de terceros.

## Mecanismo

El acceso habilita depuración local de Electron. Ese canal permite ejecutar JavaScript en el renderer: **no debe exponerse a la red ni compartirse**. No se instala un servidor público. El auxiliar valida propietario del puerto, paquete oficial, loopback e identidad del navegador antes de aplicar código propio. Estas verificaciones reducen errores de destino; no convierten la depuración en una frontera de seguridad frente a otro proceso local con los mismos permisos.

El runtime distribuido no consulta datos de cuenta, límites de uso, conversaciones, cookies o credenciales. Los archivos importados se tratan como medios; no se ejecutan páginas web, scripts ni escenas. El mod necesita acceso al DOM para decorar la interfaz. Un bug puede afectar legibilidad, rendimiento o controles; no se promete ausencia de fallos.

No incluir en issues `endpoint.json`, logs sin revisar, capturas de conversaciones, rutas personales ni medios protegidos. Describir la versión de Codex, versión del mod y pasos mínimos. Revisar el código antes de ejecutar scripts con ExecutionPolicy Bypass; esa opción vale para la invocación, no cambia la política global.

Para un problema de seguridad, contactar al mantenedor por un canal privado disponible en el perfil del propietario del repositorio. No publicar secretos o pruebas que afecten cuentas reales.
