const GameConfig = require('../models/GameConfig');
const LLMConfig = require('../models/LLMConfig');
const LLMCategoryGenerationHistory = require('../models/LLMCategoryGenerationHistory');
const LLMCardGenerationHistory = require('../models/LLMCardGenerationHistory');
const LLMInteractionHistory = require('../models/LLMInteractionHistory');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

let groq = null;
let globalGameConfig = {};
let llmConfigs = {};
let configsLoaded = false;
let cardImageFilenames = [];

const CARD_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const loadGameConfig = async () => {
  if (Object.keys(globalGameConfig).length === 0) { // Only load if not already loaded
    try {
      const configs = await GameConfig.findAll();
      globalGameConfig = configs.reduce((acc, config) => {
        acc[config.config_key] = parseInt(config.config_value, 10) || config.config_value;
        return acc;
      }, {});
      console.log('GameConfig loaded.');
    } catch (error) {
      console.error('Error loading GameConfig:', error);
      throw error;
    }
  }
};

const loadLLMConfigs = async () => {
  if (Object.keys(llmConfigs).length === 0) { // Only load if not already loaded
    try {
      const configs = await LLMConfig.findAll();
      // Clear existing properties to ensure a fresh load
      for (const key in llmConfigs) {
        delete llmConfigs[key];
      }
      configs.forEach(config => {
        console.log(`aiService: Raw config for ${config.config_name}:`, config);
        llmConfigs[config.config_name] = config.toJSON();
        console.log(`aiService: JSON config for ${config.config_name}:`, llmConfigs[config.config_name]);
      });
      console.log('LLMConfig loaded.');
    } catch (error) {
      console.error('Error loading LLMConfig:', error);
      throw error;
    }
  }
};

const loadCardImages = async () => {
  try {
    const files = await fs.promises.readdir(CARD_IMAGES_DIR);
    cardImageFilenames = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    console.log(`Loaded ${cardImageFilenames.length} card images.`);
  } catch (error) {
    console.error('Error loading card images:', error);
    // It's okay to proceed without images if the directory is empty or doesn't exist
  }
};

// Combined function to ensure configs are loaded
const ensureConfigsLoaded = async () => {
  if (!configsLoaded) {
    await loadGameConfig();
    await loadLLMConfigs();
    await loadCardImages(); // Load card images
    // Initialize Groq after LLM configs are loaded
    if (!groq && llmConfigs.card_generator && llmConfigs.card_generator.llm_api_key) {
      groq = new Groq({
        apiKey: llmConfigs.card_generator.llm_api_key,
      });
      console.log('Groq SDK initialized with API key from DB.');
    } else if (!groq) {
      console.warn('Groq SDK not initialized: LLM API key not found in DB for card_generator.');
    }
    
    configsLoaded = true;
  }
};

// Export the initialize function and getters
const initialize = async () => {
  await ensureConfigsLoaded();
};

const getGlobalGameConfig = () => globalGameConfig;
const getLlmConfigs = () => llmConfigs;

const getCorruptionTypes = async (userId, cargo_actual, user_edad, user_ideologia, user_profile, idioma, num_tipos, playerLevel) => {
  await ensureConfigsLoaded(); // Ensure configs are loaded
  const config = llmConfigs.category_generator;
  if (!config) {
    throw new Error('LLM configuration for category_generator not found.');
  }

  // 1. Recuperación y Actualización del Historial
  const historyEntries = await LLMCategoryGenerationHistory.findAll({
    where: { user_id: userId },
    order: [['timestamp', 'DESC']],
  });

  let previousCategories = [];
  if (historyEntries.length > 0) {
    historyEntries.forEach(entry => {
      try {
        const parsedCategories = JSON.parse(entry.categories_generated);
        if (Array.isArray(parsedCategories)) {
          previousCategories = previousCategories.concat(parsedCategories);
        }
      } catch (parseError) {
        console.error('Error parsing categories_generated from history:', parseError);
      }
    });
    previousCategories = [...new Set(previousCategories)];
  }

  // 2. Construcción del Prompt para Groq
  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_edad}}/g, user_edad || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_ideologia}}/g, user_ideologia || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_profile}}/g, user_profile || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{num_tipos}}/g, num_tipos);
  humanPromptContent = humanPromptContent.replace(/{{categorias_previas}}/g, JSON.stringify(previousCategories));

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  // 3. Llamada al Modelo LLM de Groq con reintentos
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      
      const parsedResponse = JSON.parse(llmResponseContent);
      const categories = parsedResponse.categorias || [];

      // 4. Guardar en el Historial
      await LLMCategoryGenerationHistory.create({
        user_id: userId,
        timestamp: new Date(),
        prompt_sent: JSON.stringify(messages),
        llm_response: llmResponseContent,
        categories_generated: JSON.stringify(categories),
      });

      return categories;
    } catch (error) {
      console.error(`Error calling Groq API for corruption types (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

const getCards = async (userId, cargo_actual, tipo_de_corrupcion_elegido, idioma, playerLevel) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.card_generator;
  if (!config) {
    throw new Error('LLM configuration for card_generator not found.');
  }

  // 1. Recuperación y Actualización del Historial de Cartas
  const historyEntries = await LLMCardGenerationHistory.findAll({
    where: { user_id: userId },
    order: [['timestamp', 'DESC']],
  });

  let previousCards = [];
  if (historyEntries.length > 0) {
    historyEntries.forEach(entry => {
      try {
        const parsedCards = JSON.parse(entry.cards_generated);
        if (Array.isArray(parsedCards)) {
          previousCards = previousCards.concat(parsedCards);
        }
      } catch (parseError) {
        console.error('Error parsing cards_generated from history:', parseError);
      }
    });
    // Consider a more sophisticated way to handle previous cards if needed,
    // e.g., filtering by type or ensuring uniqueness based on title.
  }

  // 2. Construcción del Prompt para Groq
  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tipo_de_corrupcion_elegido}}/g, tipo_de_corrupcion_elegido || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{num_cartas}}/g, globalGameConfig.NUM_CORRUPTION_CARDS || 5);
  humanPromptContent = humanPromptContent.replace(/{{cartas_previas}}/g, JSON.stringify(previousCards));

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  // 3. Llamada al Modelo LLM de Groq con reintentos
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log('aiService: card_generator config.max_tokens:', config.max_tokens);
      console.log('aiService: Prompt for card generation:', messages);
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      console.log('aiService: Raw LLM response for cards:', llmResponseContent);
      
      const parsedResponse = JSON.parse(llmResponseContent);
      console.log('aiService: Parsed LLM response:', parsedResponse); // Log parsed response
      // Groq might return 'sub_options' or 'options'
      const cards = parsedResponse.subopciones || parsedResponse.options || [];
      console.log('aiService: Extracted cards (sub_options/options):', cards); // Log extracted cards

      // Map 'titulo' to 'title' and 'descripcion' to 'description'
      const mappedCards = cards.map(card => ({
        title: card.titulo,
        description: card.descripcion,
        tags_obligatorios: card.tags_obligatorios,
        // Keep other properties if any, or explicitly list them
      }));
      console.log('aiService: Mapped cards:', mappedCards); // Log mapped cards

      // Add a unique random image URL to each card
      const availableImages = [...cardImageFilenames]; // Create a mutable copy
      const cardsWithImages = mappedCards.map(card => {
        let imageUrl = null;
        if (availableImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableImages.length);
          const selectedImage = availableImages.splice(randomIndex, 1)[0]; // Remove and get the selected image
          imageUrl = `/images/cards/${selectedImage}`;
        }
        return { ...card, image_url: imageUrl };
      });
      console.log('aiService: Cards with images before return:', cardsWithImages); // Log cards with images

      // 4. Guardar en el Historial
      await LLMCardGenerationHistory.create({
        user_id: userId,
        timestamp: new Date(),
        prompt_sent: JSON.stringify(messages),
        llm_response: llmResponseContent,
        cards_generated: JSON.stringify(cardsWithImages),
      });

      return cardsWithImages;
    } catch (error) {
      console.error(`Error calling Groq API for cards (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

const evaluatePlan = async (userId, cargo_actual, action_chosen, tags, player_plan, idioma, playerLevel, userCountry, userAge, userPoliticalIdeology, userPersonalProfile) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.plan_evaluator;
  if (!config) {
    throw new Error('LLM configuration for plan_evaluator not found.');
  }

  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{action_chosen}}/g, action_chosen || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tags}}/g, Array.isArray(tags) ? tags.join(', ') : tags || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{player_plan}}/g, player_plan || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{player_level}}/g, playerLevel || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_country}}/g, userCountry || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_age}}/g, userAge || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_political_ideology}}/g, userPoliticalIdeology || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{user_personal_profile}}/g, userPersonalProfile || 'N/A');

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log('aiService: Prompt for plan evaluation:', messages);
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      console.log('aiService: Raw LLM response for plan evaluation:', llmResponseContent);
      const parsedResponse = JSON.parse(llmResponseContent);
      console.log('aiService: Parsed LLM response for plan evaluation:', parsedResponse);

      // Save interaction history
      await LLMInteractionHistory.create({
        user_id: userId,
        timestamp: new Date(),
        level: playerLevel,
        action_title: action_chosen,
        narrated_plan_text: player_plan,
        llm_evaluation_json: parsedResponse.llm_evaluation || {},
        llm_advice_json: parsedResponse.llm_advice || {},
      });

      return parsedResponse;
    } catch (error) {
      console.error(`Error calling Groq API for plan evaluation (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
};

const generateScandalHeadline = async (userId, cargo_actual, idioma, be_actual) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.scandal_headline_generator;
  if (!config) {
    throw new Error('LLM configuration for scandal_headline_generator not found.');
  }

  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{cargo_actual}}/g, cargo_actual || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');
  humanPromptContent = humanPromptContent.replace(/{{be_actual}}/g, be_actual);

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
        max_tokens: parseInt(config.max_tokens, 10),
        response_format: { type: "json_object" },
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '{}';
      const parsedResponse = JSON.parse(llmResponseContent);
      return parsedResponse.headline || 'Un escándalo ha sacudido Costa Pobre!';
    } catch (error) {
      console.error(`Error calling Groq API for scandal headline generation (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
};

const generateDevPlan = async (quality, titulo_accion_elegida, descripcion_accion_elegida, tags_accion_elegida, idioma) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.plan_generator_dev; // Assuming a config for dev plan generation
  if (!config) {
    throw new Error('LLM configuration for plan_generator_dev not found.');
  }

  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{quality}}/g, quality || 'good');
  humanPromptContent = humanPromptContent.replace(/{{titulo_accion_elegida}}/g, titulo_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{descripcion_accion_elegida}}/g, descripcion_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tags_accion_elegida}}/g, Array.isArray(tags_accion_elegida) ? tags_accion_elegida.join(', ') : tags_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '';
      return llmResponseContent;
    } catch (error) {
      console.error(`Error calling Groq API for dev plan generation (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
};

const generateWildcardPlan = async (titulo_accion_elegida, descripcion_accion_elegida, tags_accion_elegida, idioma) => {
  await ensureConfigsLoaded();
  const config = llmConfigs.plan_generator_wildcard;
  if (!config) {
    throw new Error('LLM configuration for plan_generator_wildcard not found.');
  }

  let humanPromptContent = config.human_prompt;
  humanPromptContent = humanPromptContent.replace(/{{titulo_accion_elegida}}/g, titulo_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{descripcion_accion_elegida}}/g, descripcion_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{tags_accion_elegida}}/g, Array.isArray(tags_accion_elegida) ? tags_accion_elegida.join(', ') : tags_accion_elegida || 'N/A');
  humanPromptContent = humanPromptContent.replace(/{{idioma}}/g, idioma || 'es');

  const messages = [
    { role: 'system', content: config.system_prompt || '' },
    { role: 'user', content: humanPromptContent },
  ];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: config.model_name,
        temperature: parseFloat(config.temperature),
      });

      const llmResponseContent = chatCompletion.choices[0]?.message?.content || '';
      
      return llmResponseContent;
    } catch (error) {
      console.error(`Error calling Groq API for wildcard plan generation (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
};

module.exports = {
  initialize,
  getGlobalGameConfig,
  getLlmConfigs,
  getCorruptionTypes,
  getCards,
  evaluatePlan,
  generateScandalHeadline,
  generateDevPlan,
  generateWildcardPlan,
};