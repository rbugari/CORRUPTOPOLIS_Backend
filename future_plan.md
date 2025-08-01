## Plan Futuro para el Lanzamiento Beta a Producción de CORRUPTOPIA_IA

### **Estado Actual del Proyecto:**

Basado en la revisión del `doc_funcional_markdown.MD` (versión 6.2, "CORRUPTOPIA_IA") y los cambios recientes, el proyecto se encuentra en un estado funcional avanzado.

**Funcionalidades Clave Implementadas:**

*   **Core Gameplay Loop:** Generación dinámica de categorías y cartas de corrupción, narración de planes (texto/STT), evaluación por LLM, actualización de recursos (PC, INF, BE).
*   **Progresión de Niveles:** Sistema de 7 niveles con requisitos de ascenso y evolución visual del avatar.
*   **Sistema de Escándalos:** Activación, titulares generados por LLM, 3 opciones de resolución con costos y consecuencias (incluyendo GAME OVER).
*   **Condición de Victoria:** El juego termina al alcanzar el Nivel 7 y 1000+ PC, con pantalla de victoria (`GameWon.vue`).
*   **Gestión de Cuentas:** Registro (con verificación de email, avatar, datos extendidos), login, edición de perfil.
*   **Monetización (Freemium):** Pase Premium (Stripe), rescate de escándalo (Stripe), anuncios recompensados ("Comodín", botón "Ver Anuncio"), anuncios intersticiales.
*   **Soporte Multi-idioma:** UI estática e IA dinámica adaptadas al idioma del usuario.
*   **Diseño UI/UX:** Estilo "Noir Retro" responsivo y moderno.
*   **Modo de Depuración:** Herramientas para facilitar pruebas y desarrollo.
*   **Arquitectura Técnica:** Frontend Vue.js, Backend Express.js, Orquestación IA con FlowiseAI, MySQL.
*   **Seeders:** Archivos de seeding actualizados y sincronizados con el esquema de la base de datos.
*   **Seguridad (Secretos):** Eliminación de claves de API del historial de Git y uso de variables de entorno.

### **Análisis para un Lanzamiento Beta a Producción:**

Aunque el proyecto es funcional, un lanzamiento a producción (incluso para beta testers) requiere atención a la estabilidad, rendimiento, seguridad y monitoreo.

**Lo que falta o necesita ser reforzado:**

1.  **Pruebas Exhaustivas (Crítico):**
    *   **Automatización de Pruebas:** El "Proceso de Prueba Integral" en el Anexo I es excelente como guía manual, pero para producción, se necesitan pruebas unitarias, de integración y end-to-end automatizadas para garantizar que los cambios futuros no introduzcan regresiones.
    *   **Pruebas de Carga/Rendimiento:** Evaluar cómo se comporta la aplicación bajo carga (múltiples usuarios simultáneos) para identificar cuellos de botella en el backend, la base de datos y las llamadas a LLM.
    *   **Pruebas de Seguridad:** Realizar pruebas de penetración básicas y auditorías de código para identificar vulnerabilidades (ej. inyección SQL, XSS, manejo de sesiones).
    *   **Pruebas de Monetización:** Asegurar que todas las integraciones de Stripe (Premium Pass, Rescate de Escándalo) funcionen perfectamente en el entorno de producción de Stripe (no solo en el modo de prueba).

2.  **Manejo de Errores y Logging (Mejora):**
    *   **Logging Centralizado:** Implementar un sistema de logging robusto en el backend que capture errores, advertencias y eventos importantes, y que pueda ser monitoreado fácilmente en producción (ej. con herramientas como Winston, Pino, o integraciones con servicios de log como CloudWatch, Loggly).
    *   **Manejo de Errores Frontend:** Asegurar que la UI maneje gracefully los errores del backend y proporcione retroalimentación útil al usuario sin exponer detalles técnicos sensibles.

3.  **Optimización de Rendimiento:**
    *   **Optimización de Consultas a DB:** Revisar las consultas SQL generadas por Sequelize para asegurar que sean eficientes y utilicen índices adecuadamente.
    *   **Optimización de Llamadas a LLM:** Las llamadas a LLM pueden ser lentas y costosas. Considerar estrategias de caching para respuestas comunes o límites de uso.
    *   **Optimización de Frontend:** Minificación de assets, lazy loading de componentes, optimización de imágenes.

4.  **Seguridad Adicional:**
    *   **Validación de Entrada:** Reforzar la validación de todos los inputs del usuario en el backend para prevenir ataques.
    *   **Rate Limiting:** Implementar límites de tasa en los endpoints de la API (especialmente autenticación y llamadas a LLM) para prevenir abusos y ataques de denegación de servicio.
    *   **Protección de Rutas:** Asegurar que todas las rutas sensibles del backend estén protegidas por autenticación y autorización adecuadas.

5.  **Configuración de Entorno de Producción:**
    *   **Variables de Entorno:** Confirmar que todas las variables de entorno necesarias para producción están definidas y se cargan correctamente en el entorno de despliegue.
    *   **Modo de Juego:** Asegurarse de que `GAME_MODE` en `game_config` se establezca en `production` para deshabilitar las herramientas de depuración y activar comportamientos específicos de producción.

6.  **Monitoreo y Alertas:**
    *   Configurar herramientas de monitoreo para el servidor, la base de datos y la aplicación (ej. Prometheus, Grafana, New Relic, Datadog) para detectar problemas en tiempo real (errores, latencia, uso de recursos).
    *   Establecer alertas para notificar al equipo sobre incidentes críticos.

7.  **Mecanismo de Feedback para Beta Testers:**
    *   Implementar una forma sencilla para que los beta testers reporten errores, envíen sugerencias y proporcionen feedback (ej. un formulario en la aplicación, un canal de Discord, un sistema de tickets).

8.  **Documentación para Despliegue y Operaciones:**
    *   Crear un `README.md` claro para el repositorio que incluya instrucciones de configuración, despliegue y ejecución para un nuevo desarrollador o para el equipo de operaciones.
    *   Documentar los pasos para el despliegue en el entorno de producción (Docker, configuración del servidor, etc.).

### **Próximos Pasos Sugeridos para el Lanzamiento Beta:**

1.  **Priorizar Pruebas Automatizadas:** Desarrollar un conjunto básico de pruebas unitarias y de integración para las funcionalidades críticas (autenticación, ciclo de juego, monetización, escándalos).
2.  **Reforzar Manejo de Errores y Logging:** Implementar un sistema de logging básico y asegurar que los errores se capturen y se muestren de forma amigable al usuario.
3.  **Configurar Entorno de Producción:** Asegurarse de que el `GAME_MODE` se establezca correctamente y que todas las variables de entorno de producción estén configuradas en el servidor de despliegue.
4.  **Implementar Mecanismo de Feedback:** Añadir un formulario simple o un enlace a una herramienta de feedback para los beta testers.
5.  **Revisar y Optimizar LLM:** Monitorear el rendimiento y costo de las llamadas a LLM durante las pruebas internas.
