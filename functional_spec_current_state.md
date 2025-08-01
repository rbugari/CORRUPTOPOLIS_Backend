## **DOCUMENTO DE ESPECIFICACIÓN FUNCIONAL: "EL ASCENSO CORRUPTO" (Estado Actual)**

**Fecha:** 4 de Julio de 2025
**Versión:** 5.0 (Progreso de Implementación)

---

### **Contenido**

1.  **Introducción y Propósito**
2.  **Concepto General del Juego**
3.  **Audiencia Objetivo**
4.  **Jugabilidad Central ("Core Gameplay Loop") - Estado Actual**
5.  **Características Clave - Implementadas**
6.  **Interfaz de Usuario (UI) - Estructura Actual**
7.  **Arquitectura Técnica - Estado Actual**
8.  **Anexos Técnicos (Especificaciones Implementadas)**
    *   **Anexo A:** Sistema de Recursos y Fórmulas de Juego
    *   **Anexo B:** Sistema de Eventos de Escándalo (Fase 1 Implementada)
    *   **Anexo C:** Tabla de Progresión de Carrera y Balanceo (Estructura Actual)
    *   **Anexo D:** Plantillas de Prompts (Implementadas en FlowiseAI - Mocked)
    *   **Anexo F:** Scripts SQL para Tablas del Juego (MySQL - Estructura Actual)
    *   **Anexo G:** Especificación de API REST (Backend Express.js - Endpoints Implementados)

---

### **1. Introducción y Propósito**

Este documento resume el estado actual de la implementación del videojuego "El Ascenso Corrupto". Sirve como una instantánea funcional y técnica del progreso realizado, actuando como una guía para futuras iteraciones y como referencia para cualquier desarrollador que retome el proyecto.

---

### **2. Concepto General del Juego**

*   **Nombre Propuesto:** "El Ascenso Corrupto".
*   **Género:** Estrategia, Gestión de Recursos, Simulación Política, Narrativa Interactiva, Sátira.
*   **Premisa:** El jugador comienza en el Nivel 1 como un político pobre y andrajoso en Costa Pobre. Su objetivo es ascender en la jerarquía del poder hasta convertirse en Primer Ministro o Presidente (Nivel 7), utilizando la corrupción como herramienta. La progresión se visualiza en una ruta de tablero de juego, donde el avatar del personaje evoluciona visualmente, reflejando un ascenso basado en la riqueza obtenida y no en la capacidad intelectual. Todo el progreso está ligado a una cuenta de usuario persistente.
*   **Tono:** Cínico, humor negro y satírico.
*   **Perspectiva:** 2D, interfaz de usuario web.
*   **Disclaimer:** **Advertencia: Esta es una obra de ficción. Cualquier parecido con personas, lugares o eventos reales es pura coincidencia.**

---

### **3. Audiencia Objetivo**

*   Jugadores adultos (16+) interesados en juegos de estrategia, gestión y sátira política.
*   Personas que aprecian mecánicas innovadoras y la interacción con IA.
*   Audiencia global, gracias al soporte multi-idioma.
*   Jugadores que valoran la persistencia de su progreso.

---

### **4. Jugabilidad Central ("Core Gameplay Loop") - Estado Actual**

**A. Progreso por Niveles (La Escalera Política):**
*   El juego presenta una ruta visual estilo tablero de juego con 7 niveles.
*   El jugador avanza cumpliendo los requisitos de PC e INF definidos en la tabla de niveles.

**B. El Ciclo de Corrupción (Turno de Juego) - Implementado:**

1.  **Inicio de Turno:** El jugador comienza su turno en su cargo político actual.
2.  **Generación de Tipos de Corrupción y Ruleta Aleatoria:**
    *   El backend solicita a la IA (mocked) que genere 10 tipos de corrupción.
    *   El frontend muestra estos tipos y un botón "Girar Ruleta de Corrupción".
    *   Al hacer clic, se selecciona **UN (1) tipo de corrupción** de forma aleatoria.
3.  **Generación y Elección de Sub-Opciones ("Cartas"):**
    *   Una vez seleccionada la temática, el backend solicita a la IA (mocked) que genere 5 sub-opciones específicas (cartas) con título, descripción, imagen en Base64 y 3 tags.
    *   Las 5 cartas se presentan al jugador. El jugador elige y selecciona UNA (1) de estas opciones.
4.  **Narración del Plan Maestro (Input del Jugador):**
    *   El jugador describe su plan de corrupción usando texto. Se ha implementado la interfaz para grabación de audio (simulada) que rellena el campo de texto.
5.  **Evaluación por el "Mentor Corrupto" (LLM):**
    *   El plan se envía al backend, que a través del mock de FlowiseAI lo evalúa.
    *   El backend calcula la ganancia de PC, INF y el aumento de BE basándose en la evaluación del LLM y el factor de nivel actual.
    *   El estado del juego se actualiza en la base de datos.
6.  **Actualización y Registro:** Los recursos del jugador (PC, BE, INF) se actualizan en la base de datos y se muestran en el frontend. La interacción se guarda en el historial de la cuenta.
    *   Se muestra explícitamente la ganancia de PC, INF y el aumento de BE para la jugada actual.
7.  **Gestión de Escándalos (Fase 1):** Si la Barra de Escándalo (BE) supera el umbral de 85, se activa una bandera `scandal_triggered` en la respuesta del backend.
    *   Se ha implementado la funcionalidad para gastar INF y reducir BE.
8.  **Ascenso de Nivel:** El backend verifica automáticamente si el jugador cumple los requisitos de PC e INF para ascender de nivel y actualiza el nivel si es necesario.

**C. Gestión de Cuenta de Usuario y Persistencia:**
*   **Registro:** El usuario se registra con Nickname (único), Email, Contraseña (hashed con bcrypt), Idioma Preferido y opcionalmente una URL de Foto de Avatar.
*   **Login:** El usuario inicia sesión con Nickname y Contraseña. Se actualiza el timestamp de último login.
*   Todo el progreso se asocia a la cuenta de usuario.

---

### **5. Características Clave - Implementadas**

*   **Sistema de Gestión de Cuentas:** Login/registro para persistencia de datos.
*   **Mecánica de Corrupción Interactiva con LLM (Mocked):** La narrativa del jugador es el motor del juego.
*   **Generación Dinámica de Opciones con Tags Ocultos (Mocked):** Añade sorpresa y rejugabilidad.
*   **Input de Voz y Texto Multi-idioma con Límites (Simulado):** Accesibilidad y control.
*   **Soporte Multi-idioma:** UI estática e IA dinámica (mocked) adaptadas al idioma del usuario.
*   **Progresión Política y Visual:** Ascenso en el tablero y evolución del avatar (imagen y descripción visual del personaje por nivel).
*   **Historial de Interacciones:** Permite al jugador revisar y aprender de sus acciones pasadas.
*   **Visualización Detallada de Ganancias:** Muestra PC, INF y BE ganados por jugada.
*   **Sistema de Escándalos (Detección y Reducción):** Detecta umbral de BE y permite gastar INF para reducirla.
*   **Navegación Mejorada:** Pie de página con enlaces a Historial y Explicación (Help).

---

### **6. Interfaz de Usuario (UI) - Estructura Actual**

La interfaz de usuario en `Game.vue` está estructurada en las siguientes áreas, con visibilidad controlada por el estado del juego:

*   **Encabezado del Juego (`game-header`):**
    *   **`game-header-top`:** Título del juego ("CORRUPTIA"), avatar del usuario y nickname.
    *   **`game-header-bottom`:**
        *   **Bloque Izquierdo (`level-details`):** Cargo actual, imagen del personaje del nivel y descripción visual del personaje.
        *   **Bloque Derecho (`resource-details`):** Nivel, Puntos de Corrupción (PC), Influencia (INF) y Barra de Escándalo (BE). Los recursos PC e INF muestran el valor actual y el requerido para el siguiente nivel (ej. "PC: 1500 / 5000").
*   **Área Operativa / Selección (`game-operational-area`):** Visible cuando el jugador necesita hacer una elección.
    *   Muestra los 10 tipos de corrupción disponibles y el botón "Girar Ruleta de Corrupción".
    *   Muestra el tipo de corrupción seleccionado y el botón "Generar Cartas de Acción".
    *   Muestra las 5 cartas de acción para elegir.
*   **Área de Composición del Mensaje (`game-message-composition`):** Visible cuando el jugador debe narrar su plan.
    *   Muestra la acción seleccionada y sus tags.
    *   Controles para grabar/detener audio (simulado) y un campo de texto para el plan.
    *   Botón "Evaluar Plan".
*   **Área de Resultados (`game-results-area`):** Visible después de la evaluación del plan.
    *   Muestra la evaluación del Mentor, los PC, INF y BE ganados en la jugada actual, y el consejo.
*   **Área de Siguiente Turno (`game-next-turn-area`):** Visible después de mostrar los resultados.
    *   Botón "Siguiente Turno".
*   **Pie de Página (`game-footer`):** Contiene botones para "Cerrar Sesión", "Ver Historial" y "Explicación (Help)".

---

### **7. Arquitectura Técnica - Estado Actual**

*   **Frontend:**
    *   **Framework:** Vue.js (versión 3), utilizando Vite.
    *   **Comunicación:** Se comunica exclusivamente con la API Propia (backend) a través de Axios.
    *   **Enrutamiento:** Vue Router para la navegación entre vistas (Login, Register, Game, History, Help).
*   **Backend (API Propia):**
    *   **Framework:** Express.js (Node.js).
    *   **Responsabilidad:** Orquesta la lógica de negocio, actúa como proxy seguro para la IA, maneja la autenticación, la gestión del estado del juego y el historial.
    *   **Modelos Sequelize:** `User`, `UserGameState`, `GameLevel`, `LLMInteractionHistory`.
*   **Orquestación de IA (Servicio Interno):**
    *   **FlowiseAI:** Instancia hosteada (actualmente **mocked** en `services/aiService.js`).
*   **Base de Datos Relacional:**
    *   **Tecnología:** MySQL.
    *   **Estructura:** Tablas `users`, `user_gamestate`, `llm_interactions_history`, `game_levels` (con columnas actualizadas para requisitos de ascenso y factor de ganancia).
*   **Hosting de Imágenes:** Archivos estáticos servidos desde la carpeta `public/images` del backend.

---

### **8. Anexos Técnicos (Especificaciones Implementadas)**

**Anexo A: Sistema de Recursos y Fórmulas de Juego**
*   **PC (Puntos de Corrupción):** `pc` en `user_gamestate`.
*   **INF (Influencia):** `inf` en `user_gamestate`.
*   **BE (Barra de Escándalo):** `be` en `user_gamestate` (rango 0-100).
*   **Fórmula de Ganancia de Puntos de Corrupción (PC):** `PC_Ganado = (evaluacion.pc_ganancia.valor / 10) * Factor_Nivel_Actual`. Implementada en `aiController.js`.
*   **Fórmula de Aumento de Barra de Escándalo (BE):** `Aumento_BE = evaluacion.be_aumento.valor`. Implementada en `aiController.js`.
*   **Fórmula de Ganancia de Influencia (INF):** `INF_Ganado = evaluacion.inf_ganancia.valor`. Implementada en `aiController.js`.
*   **Fórmula de Reducción Pasiva de la Barra de Escándalo (BE):** `BE_Actualizada = BE_Actual - 1` al final de cada turno exitoso. Implementada en `aiController.js`.
*   **Fórmula de Gasto de Influencia (INF) para Reducir Escándalo (BE):** `Reduccion_BE_con_INF = Gasto_INF * 2`. Implementada en `gameController.js` (`reduceScandal`).

**Anexo B: Sistema de Eventos de Escándalo (Fase 1 Implementada)**
*   **Disparador:** `scandal_triggered` bandera en la respuesta del backend si `BE >= 85`.
*   **Mecánica:** Se ha implementado la funcionalidad para gastar INF y reducir BE (`POST /game/reduce-scandal`).

**Anexo C: Tabla de Progresión de Carrera y Balanceo (Estructura Actual)**
*   Tabla `game_levels` con columnas: `id`, `level_number`, `title`, `pc_required_for_ascension`, `inf_required_for_ascension`, `pc_gain_factor`, `character_image_url`, `description_visual`, `created_at`, `updated_at`.
*   Datos de los 7 niveles insertados.

**Anexo D: Plantillas de Prompts (Implementadas en FlowiseAI - Mocked)**
*   `aiService.js` simula las respuestas de FlowiseAI para:
    *   Generador de Tipos de Corrupción.
    *   Generador de Sub-Opciones ("Cartas").
    *   Evaluador de Planes (devuelve valores aleatorios para `pc_ganancia.valor`, `be_aumento.valor`, `inf_ganancia.valor`).

**Anexo F: Scripts SQL para Tablas del Juego (MySQL - Estructura Actual)**
*   Scripts `CREATE TABLE` y `INSERT` para `users`, `user_gamestate`, `llm_interactions_history`, y `game_levels` (con las columnas actualizadas).

**Anexo G: Especificación de API REST (Backend Express.js - Endpoints Implementados)**
*   `POST /auth/register`
*   `POST /auth/login`
*   `GET /game/progress` (devuelve `gameState`, `levelInfo`, `userInfo`, `nextLevelInfo`)
*   `POST /game/progress` (actualiza `pc`, `inf`, `be`, maneja ascenso de nivel, devuelve `gameState` actualizado con `levelInfo`, `userInfo`, `nextLevelInfo`)
*   `POST /game/reduce-scandal` (gasta INF para reducir BE)
*   `GET /history/all`
*   `POST /history/add`
*   `POST /ai/get-corruption-types`
*   `POST /ai/get-cards`
*   `POST /ai/evaluate-plan` (calcula ganancias de recursos, maneja ascenso, devuelve `updated_game_state` y ganancias por turno)

---
