const aiService = require('../services/aiService');
const UserGameState = require('../models/UserGameState');
const GameLevel = require('../models/GameLevel');
const User = require('../models/User'); // Importar el modelo User
const { getGameConfig } = require('../config/gameConfig');
const GameConfig = require('../models/GameConfig'); // Importar GameConfig
const UserLog = require('../models/UserLog'); // Importar el modelo UserLog

// Helper function to get config value
const getConfigValue = async (key) => {
  const config = await GameConfig.findOne({ where: { config_key: key } });
  return config ? config.config_value : null;
};

exports.getCorruptionTypes = async (req, res) => {
  console.log('Backend: Solicitud recibida para getCorruptionTypes.');
  const { idioma } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    const gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const playerLevel = gameState ? gameState.level : 1; // Default to 1 if no game state
    const num_tipos = parseInt(await getConfigValue('NUM_CORRUPTION_TYPES')) || 10; // Get from game_config, default to 10
    const gameLevel = await GameLevel.findOne({ where: { level_number: playerLevel } });
    const userLanguage = user.selected_language || 'es';
    const cargo_actual_multilingual = userLanguage === 'en' ? gameLevel.title_en : gameLevel.title_es;

    const types = await aiService.getCorruptionTypes(
      userId,
      cargo_actual_multilingual,
      user.age || null,
      user.political_ideology || null,
      user.personal_profile || null,
      idioma,
      num_tipos,
      playerLevel
    );
    res.json(types);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getCards = async (req, res) => {
  const { tipo_de_corrupcion_elegido, idioma } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    const gameState = await UserGameState.findOne({ where: { user_id: userId } });
    const playerLevel = gameState ? gameState.level : 1; // Default to 1 if no game state
    const gameLevel = await GameLevel.findOne({ where: { level_number: playerLevel } });
    const userLanguage = user.selected_language || 'es';
    const cargo_actual_multilingual = userLanguage === 'en' ? gameLevel.title_en : gameLevel.title_es;

    const cards = await aiService.getCards(
      userId,
      cargo_actual_multilingual,
      tipo_de_corrupcion_elegido,
      idioma,
      playerLevel
    );
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.evaluatePlan = async (req, res) => {
  const { titulo_accion_elegida, tags_accion_elegida, plan_del_jugador, idioma } = req.body;
  const userId = req.user.id; // Obtener el ID del usuario autenticado

  try {
    // 1. Obtener el estado actual del juego y el nivel del jugador
    let gameState = await UserGameState.findOne({ where: { user_id: userId } });
    if (!gameState) {
      return res.status(404).json({ msg: 'Game state not found for user.' });
    }

    let gameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    if (!gameLevel) {
      return res.status(404).json({ msg: 'Game level information not found.' });
    }

    const user = await User.findByPk(userId); // Obtener los datos del usuario para pasar al LLM
    const userLanguage = user.selected_language || 'es';
    const cargo_actual_multilingual = userLanguage === 'en' ? gameLevel.title_en : gameLevel.title_es;

    const tagsArray = Array.isArray(tags_accion_elegida) ? tags_accion_elegida : [tags_accion_elegida];

    // 2. Obtener la evaluación del LLM
    const evaluationResult = await aiService.evaluatePlan(
      userId, 
      cargo_actual_multilingual, 
      titulo_accion_elegida, 
      tagsArray, 
      plan_del_jugador, 
      idioma, 
      gameState.level, // Pass playerLevel
      user.country_of_origin, 
      user.age, 
      user.political_ideology, 
      user.personal_profile
    );
    console.log('aiController: evaluationResult after aiService call =', evaluationResult);
    const llmEvaluation = evaluationResult?.llm_evaluation_json ?? {};
    const llmAdvice = evaluationResult?.llm_advice_json ?? {};

    console.log('aiController: llmEvaluation.pc_ganancia.value =', llmEvaluation.pc_ganancia?.valor);
    console.log('aiController: gameLevel.pc_gain_factor =', gameLevel.pc_gain_factor);
    console.log('aiController: llmEvaluation.be_aumento.value =', llmEvaluation.be_aumento?.valor);
    console.log('aiController: llmEvaluation.inf_ganancia.value =', llmEvaluation.inf_ganancia?.valor);
    console.log('aiController: gameLevel.inf_gain_factor =', gameLevel.inf_gain_factor);

    // 3. Aplicar fórmulas de ganancia de recursos
    const pcGanado = Math.round((llmEvaluation.pc_ganancia?.valor ?? 0) * gameLevel.pc_gain_factor * (1 + (gameState.inf / 100)));
    const aumentoBE = (llmEvaluation.be_aumento?.valor ?? 0) * (2 - (gameState.inf / 100));
    const infGanado = Math.round(llmEvaluation.inf_ganancia?.valor ?? 0);

    console.log('aiController: Calculated infGanado =', infGanado);
    console.log('aiController: Calculated aumentoBE =', aumentoBE);

    // Store previous state for logging
    const previousState = {
      pc: gameState.pc,
      inf: gameState.inf,
      be: gameState.be,
    };

    gameState.pc += pcGanado;
    // Ensure PC does not exceed the current level's required PC for ascension
    gameState.pc = Math.min(gameState.pc, gameLevel.pc_required_for_ascension);
    gameState.inf = Math.round(Math.min(100, gameState.inf + infGanado));
    gameState.be += aumentoBE;

    // Asegurarse de que BE no exceda 100
    gameState.be = Math.min(100, gameState.be);

    // 4. Reducción pasiva de BE (al final de cada turno exitoso)
    gameState.be = Math.max(0, gameState.be - 1);

    // 5. Lógica de ascenso de nivel (CORREGIDA)
    const currentLevelConfig = await GameLevel.findOne({ where: { level_number: gameState.level } });
    let ascended = false;
    let gameWon = false; // Initialize gameWon flag

    if (currentLevelConfig && gameState.pc >= currentLevelConfig.pc_required_for_ascension) {
      const nextLevelNumber = gameState.level + 1;
      const nextLevelConfig = await GameLevel.findOne({ where: { level_number: nextLevelNumber } });

      if (nextLevelConfig) {
        const monetizacionNivelPremium = parseInt(await getConfigValue('MONETIZACION_NIVEL_PREMIUM'));
        
        gameState.level = nextLevelNumber;
        ascended = true;
        console.log(`¡Jugador ${userId} ha ascendido al nivel ${nextLevelNumber}!`);
        // Reduce influence by 80% upon level up
        gameState.inf = Math.round(gameState.inf * 0.20);
      }
    }

    // Check for game win condition after all updates
    const maxLevel = await GameLevel.max('level_number');
    if (gameState.level === maxLevel) {
      const finalLevelConfig = await GameLevel.findOne({ where: { level_number: maxLevel } });
      if (finalLevelConfig && gameState.pc >= finalLevelConfig.pc_required_for_ascension) {
        gameWon = true;
        user.has_won = true; // Set has_won to true for the user
        await user.save(); // Save the user object
        console.log(`¡Jugador ${userId} ha ganado el juego!`);
      }
    }

    // Verificar si se dispara un escándalo
    let scandalTriggered = false;
    let scandalHeadline = null;
    if (gameState.be >= 85) {
      try {
        scandalTriggered = true;
        scandalHeadline = await aiService.generateScandalHeadline(userId, cargo_actual_multilingual, user.selected_language || 'es', gameState.be);
        console.log(`¡Jugador ${userId} ha disparado un escándalo! BE: ${gameState.be}, Titular: ${scandalHeadline}`);
      } catch (scandalError) {
        console.error('Error generating scandal headline:', scandalError.message);
        // If the scandal headline generation fails, we'll send an error to the client
        // and prevent the player from being penalized.
        return res.status(500).json({ msg: 'Error generating scandal headline. Please try again.' });
      }
    }

    // 6. Guardar el estado del juego actualizado
    await gameState.save();

    // Calculate changes for logging
    const pc_change = gameState.pc - previousState.pc;
    const inf_change = gameState.inf - previousState.inf;
    const be_change = gameState.be - previousState.be;

    // Log the turn played event
    await UserLog.create({
      user_id: userId,
      event_type: 'turn_played',
      level: gameState.level,
      pc_change: pc_change,
      inf_change: inf_change,
      be_change: be_change,
      pc_current: gameState.pc,
      inf_current: gameState.inf,
      be_current: gameState.be,
      action_title: titulo_accion_elegida, 
      details: { tags: tagsArray, narrated_plan: plan_del_jugador },
    });

    // 7. Volver a cargar la información del nivel después de un posible ascenso
    const updatedGameLevel = await GameLevel.findOne({ where: { level_number: gameState.level } });
    // const user = await User.findByPk(userId); // Eliminada la declaración duplicada

    // Obtener la información del *nuevo* siguiente nivel si hubo ascenso
    const newNextLevelNumber = gameState.level + 1;
    const newNextLevel = await GameLevel.findOne({ where: { level_number: newNextLevelNumber } });

    // Calculate dev calculation details
    const llm_pc_valor = llmEvaluation.pc_ganancia.value;
    const pc_gain_factor = gameLevel.pc_gain_factor;
    const inf_actual = gameState.inf;
    const influence_multiplier = (1 + (inf_actual / 100));
    const raw_pc_gain = llm_pc_valor * pc_gain_factor * influence_multiplier;
    const final_pc_gain = Math.round(raw_pc_gain);

    const dev_calculation_details = {
      llm_pc_valor: llm_pc_valor,
      pc_gain_factor: pc_gain_factor,
      inf_actual: inf_actual,
      influence_multiplier: influence_multiplier,
      raw_pc_gain: raw_pc_gain,
      final_pc_gain: final_pc_gain,
    };

    res.json({
      llm_evaluation_json: llmEvaluation,
      llm_advice_json: llmAdvice,
      updated_game_state: {
        ...gameState.toJSON(),
        levelInfo: updatedGameLevel ? updatedGameLevel.toJSON() : null,
        userInfo: user ? { nickname: user.nickname, avatar_url: user.avatar_url, selected_language: user.selected_language } : null,
        nextLevelInfo: newNextLevel ? newNextLevel.toJSON() : null,
      },
      ascended: ascended,
      scandal_triggered: scandalTriggered, // Añadir la bandera de escándalo
      scandal_headline: scandalHeadline, // Añadir el titular del escándalo
      pc_ganado_this_turn: pcGanado,
      inf_ganado_this_turn: Math.floor(infGanado),
      be_aumento_this_turn: Math.floor(aumentoBE),
      dev_calculation_details: dev_calculation_details, // Add dev calculation details
      gameWon: gameWon, // Add gameWon flag to the response
    });

  } catch (err) {
    console.error('Error evaluating plan:', err.message);
    res.status(500).send('Server error');
  }
};

exports.generateDevPlan = async (req, res) => {
  if (process.env.DEBUG !== 'true') {
    return res.status(403).send('This feature is only available in development mode.');
  }

  const { titulo_accion_elegida, descripcion_accion_elegida, tags_accion_elegida, quality_level, idioma } = req.body;

  try {
    const plan = await aiService.generateDevPlan(
      titulo_accion_elegida,
      descripcion_accion_elegida,
      tags_accion_elegida,
      quality_level,
      idioma
    );
    res.json({ plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.generateWildcardPlan = async (req, res) => {
  const { titulo_accion_elegida, descripcion_accion_elegida, tags_accion_elegida, idioma } = req.body;

  try {
    const plan = await aiService.generateWildcardPlan(
      titulo_accion_elegida,
      descripcion_accion_elegida,
      tags_accion_elegida,
      idioma
    );
    res.json({ plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
