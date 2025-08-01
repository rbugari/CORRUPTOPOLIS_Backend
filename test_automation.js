const axios = require('axios');

// --- CONFIGURACIÓN ---
const BASE_URL = 'http://localhost:3000/api'; // Asegúrate de que esta sea la URL de tu backend
const USERNAME = process.argv[2]; // El usuario que ya debe existir en tu base de datos
const PASSWORD = process.argv[3]; // La contraseña del usuario
const PLAY_INTERVAL_MIN = 1000; // Mínimo 1 segundo
const PLAY_INTERVAL_MAX = 3000; // Máximo 3 segundos


let accessToken = null;
let refreshToken = null;
let currentLevel = 1;

// --- FUNCIONES AUXILIARES ---

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- LÓGICA DE AUTENTICACIÓN ---

async function login() {
    console.log(`[${new Date().toLocaleTimeString()}] Intentando iniciar sesión como ${USERNAME}...`);
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            nickname: USERNAME,
            password: PASSWORD
        });
        accessToken = response.data.accessToken;
        refreshToken = response.data.refreshToken;
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        console.log(`[${new Date().toLocaleTimeString()}] Sesión iniciada. Access Token obtenido.`);
        console.log(`[${new Date().toLocaleTimeString()}] Access Token: ${accessToken}`);
        console.log(`[${new Date().toLocaleTimeString()}] Refresh Token: ${refreshToken}`);

        // Set user as premium for testing purposes
        try {
            await axios.post(`${BASE_URL}/auth/update-premium-status`);
            console.log(`[${new Date().toLocaleTimeString()}] Usuario ${USERNAME} marcado como premium para la simulación.`);
        } catch (premiumError) {
            console.warn(`[${new Date().toLocaleTimeString()}] No se pudo marcar al usuario como premium:`, premiumError.response ? premiumError.response.data : premiumError.message);
        }

        return true;
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al iniciar sesión:`, error.response ? error.response.data : error.message);
        return false;
    }
}

// --- LÓGICA DEL JUEGO AUTOMATIZADO ---

async function getGameProgress() {
    try {
        const response = await axios.get(`${BASE_URL}/game/progress`);
        return response.data;
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al obtener el progreso del juego:`, error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
            console.log(`[${new Date().toLocaleTimeString()}] Token expirado o inválido. Intentando refrescar...`);
            await refreshAccessToken();
            return getGameProgress(); // Reintentar después de refrescar
        }
        return null;
    }
}

async function refreshAccessToken() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        accessToken = response.data.accessToken;
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        console.log(`[${new Date().toLocaleTimeString()}] Access Token refrescado.`);
        return true;
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al refrescar el token:`, error.response ? error.response.data : error.message);
        return false;
    }
}

async function resolveScandal(scandalData) {
    console.log(`[${new Date().toLocaleTimeString()}] ¡ESCÁNDALO DETECTADO! Titular: "${scandalData.scandal_headline}"`);
    
    // Randomly choose between option A and B
    let chosenOption = Math.random() < 0.5 ? 'A' : 'B';
    let optionPayload = { choice: chosenOption };

    try {
        console.log(`[${new Date().toLocaleTimeString()}] Intentando resolver escándalo con opción: ${chosenOption}`);
        const response = await axios.post(`${BASE_URL}/game/resolve-scandal`, optionPayload);
        console.log(`[${new Date().toLocaleTimeString()}] Escándalo resuelto con opción ${chosenOption}:`, response.data.message);
        return response.data.updated_game_state; // Return the updated game state
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al resolver escándalo con opción ${chosenOption}:`, error.response ? error.response.data : error.message);
        console.log(`[${new Date().toLocaleTimeString()}] No se pudo resolver el escándalo con la opción ${chosenOption}. Probablemente GAME OVER.`);
        return false;
    }
}

async function playTurn() {
    console.log(`
--- [${new Date().toLocaleTimeString()}] INICIANDO TURNO (Nivel ${currentLevel}) ---`);
    
    let gameProgress = await getGameProgress();
    if (!gameProgress) {
        console.error(`[${new Date().toLocaleTimeString()}] No se pudo obtener el progreso del juego. Terminando simulación.`);
        return false;
    }

    currentLevel = gameProgress.level;
    console.log(`[${new Date().toLocaleTimeString()}] Progreso actual: Nivel ${gameProgress.level}, PC: ${gameProgress.pc || 0}, INF: ${(gameProgress.inf || 0).toFixed(0)}, BE: ${gameProgress.be || 0}`);

    if (gameProgress.scandal_triggered) {
        const resolvedState = await resolveScandal(gameProgress);
        if (!resolvedState) {
            console.log(`[${new Date().toLocaleTimeString()}] El juego ha terminado debido a un escándalo no resuelto.`);
            return false; // Terminar simulación si el escándalo no se resuelve
        }
        // Use the state returned directly from resolveScandal
        gameProgress = resolvedState; 
        currentLevel = gameProgress.level; // Actualizar nivel por si hubo degradación
        console.log(`[${new Date().toLocaleTimeString()}] Estado post-escándalo: Nivel ${gameProgress.level}, PC: ${gameProgress.pc}, INF: ${gameProgress.inf.toFixed(0)}, BE: ${gameProgress.be}`);
    }

    

    // 1. Generar y seleccionar tipo de corrupción
    let corruptionType = null;
    try {
        const corruptionTypesResponse = await axios.post(`${BASE_URL}/ai/get-corruption-types`, {});
        const types = corruptionTypesResponse.data;
        if (types && types.length > 0) {
            corruptionType = types[getRandomInt(0, types.length - 1)];
            console.log(`[${new Date().toLocaleTimeString()}] Tipo de corrupción seleccionado: "${corruptionType}"`);
        } else {
            console.warn(`[${new Date().toLocaleTimeString()}] No se recibieron tipos de corrupción.`);
            return true; // Continuar al siguiente turno si es posible
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al obtener tipos de corrupción:`, error.response ? error.response.data : error.message);
        return true;
    }

    // 2. Generar y seleccionar carta
    let chosenCard = null;
    try {
        const cardsResponse = await axios.post(`${BASE_URL}/ai/get-cards`, {
            corruptionType: corruptionType
        });
        
        const cards = cardsResponse.data;
        console.log(`[${new Date().toLocaleTimeString()}] Cartas recibidas:`, JSON.stringify(cards, null, 2));
        if (cards && cards.length > 0) {
            chosenCard = cards[getRandomInt(0, cards.length - 1)];
            console.log(`[${new Date().toLocaleTimeString()}] Carta seleccionada: "${chosenCard.title}" (Tags: ${chosenCard.tags_obligatorios.join(', ')})`);
        } else {
            console.warn(`[${new Date().toLocaleTimeString()}] No se recibieron cartas para el tipo de corrupción "${corruptionType}".`);
            return true;
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al obtener cartas:`, error.response ? error.response.data : error.message);
        return true;
    }

    // 3. Generar plan de corrupción (usando el endpoint DEV)
    let generatedPlan = '';
    try {
        const devPlanResponse = await axios.post(`${BASE_URL}/ai/generate-dev-plan`, {
            titulo_accion_elegida: chosenCard.title,
            descripcion_accion_elegida: chosenCard.description,
            tags_accion_elegida: chosenCard.tags_obligatorios,
            quality_level: 'muy bueno' // Siempre generar un plan de alta calidad para avanzar
        });
        generatedPlan = devPlanResponse.data.plan;
        console.log(`[${new Date().toLocaleTimeString()}] Plan de corrupción generado (DEV): "${generatedPlan}"`);
    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al generar plan DEV:`, error.response ? error.response.data : error.message);
        console.error(`[${new Date().toLocaleTimeString()}] Asegúrate de que GAME_MODE esté activado en tu backend para usar /ai/generate-dev-plan.`);
        return false; // Si no podemos generar un plan, no podemos continuar
    }

    // 4. Evaluar plan
    try {
        const evaluateResponse = await axios.post(`${BASE_URL}/ai/evaluate-plan`, {
            titulo_accion_elegida: chosenCard.title,
            tags_accion_elegida: chosenCard.tags_obligatorios,
            plan_del_jugador: generatedPlan,
            cargo_actual: gameProgress.levelInfo.title, // Pass the current level title as cargo_actual
            playerLevel: parseInt(gameProgress.level, 10) // Ensure level is an integer
        });
        const evaluation = evaluateResponse.data;
        console.log(`[${new Date().toLocaleTimeString()}] Evaluation gameWon status: ${evaluation.gameWon}`);

        // Ensure llm_evaluation_json and its properties exist
        const llmEvaluation = evaluation.llm_evaluation_json;
        if (!llmEvaluation || !llmEvaluation.pc_ganancia || !llmEvaluation.inf_ganancia || !llmEvaluation.be_aumento) {
            console.error(`[${new Date().toLocaleTimeString()}] Error: LLM evaluation data is incomplete or malformed. Raw evaluation:`, JSON.stringify(evaluation));
            return true; // Continue to next turn, but log the issue
        }

        // Calculate actual gains based on game level factors
        const pc_ganado_this_turn = llmEvaluation.pc_ganancia.value * gameProgress.levelInfo.pc_gain_factor;
        const inf_ganado_this_turn = llmEvaluation.inf_ganancia.value * gameProgress.levelInfo.inf_gain_factor;
        const be_aumento_this_turn = llmEvaluation.be_aumento.value; // BE is not multiplied by a factor

        console.log(`[${new Date().toLocaleTimeString()}] Plan evaluado. Cambios: PC: ${pc_ganado_this_turn}, INF: ${inf_ganado_this_turn}, BE: ${be_aumento_this_turn}`);
        console.log(`[${new Date().toLocaleTimeString()}] Mensaje del Mentor: "${evaluation.llm_advice_json.advice.substring(0, 100)}..."`);

        if (evaluation.gameWon) { // Check for gameWon directly from evaluation response
            console.log(`[${new Date().toLocaleTimeString()}] ¡Juego ganado! El usuario ${USERNAME} ha completado el juego.`);
            return false; // Terminar simulación
        }

        // Explicitly check for win condition on the client side for verification
        if (gameProgress.level === 7 && gameProgress.pc >= 1000) {
            console.log(`[${new Date().toLocaleTimeString()}] [VERIFICACIÓN CLIENTE] ¡Condiciones de victoria alcanzadas! Nivel: ${gameProgress.level}, PC: ${gameProgress.pc}`);
        }

        if (evaluation.requiresPremiumAccess) {
            console.log(`[${new Date().toLocaleTimeString()}] El juego requiere acceso premium para avanzar de nivel. Terminando simulación.`);
            return false;
        }

    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error al evaluar plan o guardar progreso:`, error.response ? error.response.data : error.message);
        return true;
    }

    return true; // Continuar al siguiente turno
}

// --- FUNCIÓN PRINCIPAL ---

async function runSimulation() {
    const loggedIn = await login();
    if (!loggedIn) {
        console.error(`[${new Date().toLocaleTimeString()}] No se pudo iniciar sesión. Terminando simulación.`);
        return;
    }

    let continueSimulation = true;
    while (continueSimulation) {
        continueSimulation = await playTurn();
        if (continueSimulation) {
            const waitTime = getRandomInt(PLAY_INTERVAL_MIN, PLAY_INTERVAL_MAX);
            console.log(`[${new Date().toLocaleTimeString()}] Esperando ${waitTime / 1000} segundos para el siguiente turno...`);
            await wait(waitTime);
        }
    }

    console.log(`[${new Date().toLocaleTimeString()}] Simulación finalizada.`);
}

// Iniciar la simulación
runSimulation();
