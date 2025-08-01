const { sequelize, connectDB } = require('../config/db');
const LLMConfig = require('../models/LLMConfig');

const seedLLMConfig = async () => {
  try {
    await connectDB(); // Explicitly connect to the database
    await sequelize.sync(); // Ensure the table exists

    const llmConfigs = [
      {
        config_name: 'category_generator',
        system_prompt: 'Eres un experto en corrupción política. Tu tarea es generar categorías de corrupción para un juego de simulación.',
        human_prompt: 'Genera {{num_tipos}} tipos de corrupción para un político con cargo {{cargo_actual}}, edad {{user_edad}}, ideología {{user_ideologia}} y perfil {{user_profile}}. El idioma es {{idioma}}. Evita repetir estas categorías previas: {{categorias_previas}}. Cada tipo debe ser una categoría muy corta y concisa, de UNA o DOS palabras como máximo, preferiblemente UNA. Si son dos palabras, deben estar separadas por un espacio (ej. "Tráfico Influencias", "Abuso Poder"). Tu respuesta DEBE contener exactamente {{num_tipos}} categorías. Responde en formato JSON con una clave "categorias" que contenga un array de strings.',
        model_name: 'llama3-8b-8192',
        temperature: 0.7,
        description: 'Generador de categorías de corrupción para la ruleta.',
        llm_api_key: process.env.LLM_API_KEY, // Asignar la clave API
      },
      {
        config_name: 'card_generator',
        system_prompt: 'Eres un experto en corrupción política. Tu tarea es generar sub-opciones (cartas) detalladas para un tipo de corrupción específico en un juego de simulación.',
        human_prompt: 'Genera {{num_cartas}} sub-opciones para el tipo de corrupción "{{tipo_de_corrupcion_elegido}}" para un político con cargo {{cargo_actual}}. El idioma es {{idioma}}. Cada sub-opción debe tener un "titulo", una "descripcion" y 3 "tags_obligatorios". Los tags deben ser concisos (1-2 palabras). También se le asignará una imagen. Tu respuesta DEBE ser un objeto JSON con una clave "subopciones" que contenga un array de objetos, incluso si el array está vacío. Ejemplo: {"subopciones": [{"titulo": "...", "descripcion": "...", "tags_obligatorios": ["tag1", "tag2", "tag3"]}]}.',
        model_name: 'llama3-8b-8192',
        temperature: 0.7,
        description: 'Generador de cartas de corrupción (sub-opciones).',
        llm_api_key: process.env.LLM_API_KEY, // Asignar la clave API
      },
      {
        config_name: 'plan_evaluator',
        system_prompt: 'Eres un mentor corrupto en un juego de simulación política. Evalúa el plan del jugador y proporciona una evaluación y consejos. Tu respuesta debe ser en formato JSON con dos claves: "llm_evaluation_json" y "llm_advice_json".',
        human_prompt: `El jugador, con cargo {{cargo_actual}}, ha elegido la acción "{{titulo_accion_elegida}}" con los tags {{tags_accion_elegida}}. Su plan es: "{{plan_del_jugador}}". Evalúa este plan en el idioma {{idioma}}.

Para "llm_evaluation_json":
- "evaluation" (texto): Un resumen de tu evaluación.
- "pc_ganancia" (objeto con "valor" de 1-10): Asigna un valor basado en:
  - 9-10 (Muy Bueno): Plan detallado, creativo, usa TODOS los tags, demuestra alta astucia.
  - 6-8 (Bueno): Plan coherente, usa al menos DOS tags, bien estructurado.
  - 3-5 (Regular): Plan vago, usa solo UN tag, corto o poco claro.
  - 1-2 (Malo): Ignora tags, muy corto, irrelevante o contraproducente.
- "be_aumento" (objeto con "valor" de 1-10): Asigna un valor basado en el riesgo de escándalo que el plan podría generar. **Asegúrate de que este valor refleje un riesgo realista, no siempre bajo.**:
  - 8-10 (Alto): Plan muy arriesgado, público, deja muchas huellas.
  - 5-7 (Medio): Riesgo moderado, podría ser descubierto con investigación.
  - 1-4 (Bajo): Plan discreto, difícil de rastrear, bien encubierto.
- "inf_ganancia" (objeto con "valor" de 0-10): Asigna un valor basado en la influencia que el plan podría generar. **Es crucial que este valor sea mayor a 0 si el plan es bueno o muy bueno, y refleje la capacidad de generar alianzas, manipular o controlar información.**:
  - 8-10 (Alto): Aumenta significativamente el poder o la red de contactos.
  - 5-7 (Medio): Genera influencia moderada, fortalece alianzas.
  - 0-4 (Bajo): Poca o ninguna influencia, beneficio personal directo.

Para "llm_advice_json":
- "advice" (texto): Consejos para el jugador sobre cómo mejorar su plan o qué considerar en el futuro.

Responde en formato JSON con dos claves: "llm_evaluation_json" y "llm_advice_json".`,
        model_name: 'llama3-8b-8192',
        temperature: 0.7,
        description: 'Evaluador de planes del jugador.',
        llm_api_key: process.env.LLM_API_KEY,
        max_tokens: 2048,
      },
      {
        config_name: 'scandal_headline_generator',
        system_prompt: 'Eres un generador de titulares de prensa satíricos para un juego de corrupción política.',
        human_prompt: 'Genera un titular de escándalo para un político con cargo {{cargo_actual}} y una barra de escándalo (BE) de {{be_actual}}. El idioma es {{idioma}}. Responde en formato JSON con una clave "titular_escandalo". Asegúrate de que el valor del titular sea una cadena de texto válida en JSON, escapando cualquier comilla doble interna con una barra invertida (ej. "texto con \"comillas\" internas").',
        model_name: 'llama3-8b-8192',
        temperature: 0.7,
        description: 'Generador de titulares de escándalo.',
        llm_api_key: process.env.LLM_API_KEY, // Asignar la clave API
      },
      {
        config_name: 'plan_generator_dev',
        system_prompt: `Eres un asistente de pruebas para un juego de simulación de corrupción. Tu tarea es generar un plan de corrupción para un jugador, simulando diferentes niveles de calidad en la respuesta. **IMPORTANTE: Responde ÚNICAMENTE con el texto del plan, sin introducciones, conclusiones, ni ningún otro texto adicional.**`,
        human_prompt: `Simula la respuesta de un jugador para la acción '{{titulo_accion_elegida}}' ({{descripcion_accion_elegida}}). Los tags obligatorios son: {{tags_accion_elegida}}. El nivel de calidad de la respuesta debe ser '{{quality_level}}'.

Incluye en el plan generado referencias a la acción y los tags para que la evaluación sea más precisa.

- Si la calidad es 'muy bueno', el plan debe ser detallado, creativo, usar todos los tags y tener entre 100 y 150 palabras. Debe ser una respuesta que claramente merezca una puntuación de 9 a 10.
- Si la calidad es 'bueno', el plan debe ser coherente, usar al menos dos de los tags y tener entre 50 y 100 palabras. Apunta a una calificación de 6 a 8.
- Si la calidad es 'regular', el plan debe ser vago, usar solo un tag y ser corto (20-50 palabras). Apunta a una calificación de 3 a 5.
- Si la calidad es 'malo', el plan debe ignorar los tags, ser muy corto (menos de 20 palabras) y apenas tener relación con la acción. Apunta a una calificación de 1 a 2.

El idioma de la respuesta debe ser {{idioma}}. Genera únicamente el texto del plan del jugador.`,
        model_name: 'llama3-8b-8192',
        temperature: 0.8,
        description: '(DEV-ONLY) Generador de planes de jugador para pruebas automatizadas.',
        llm_api_key: process.env.LLM_API_KEY, // Asignar la clave API
      },
      {
        config_name: 'plan_generator_wildcard',
        system_prompt: `Eres un asistente que genera planes de corrupción para un juego de simulación. Tu tarea es crear un plan de corrupción coherente y en primera persona, como si el jugador lo estuviera narrando. El plan debe ser una historia continua, sin enumeraciones ni secciones, y debe integrar de forma natural los tags proporcionados. El plan debe ser de calidad "buena" y tener entre 50 y 100 palabras.`,
        human_prompt: `Genera un plan de corrupción para la acción '{{titulo_accion_elegida}}' ({{descripcion_accion_elegida}}). Los tags obligatorios que debes integrar en la narrativa son: {{tags_accion_elegida}}. El idioma de la respuesta debe ser {{idioma}}.`,
        model_name: 'llama3-8b-8192',
        temperature: 0.8,
        description: 'Generador de planes de jugador para la funcionalidad de comodín (anuncios recompensados).',
        llm_api_key: process.env.LLM_API_KEY, // Asignar la clave API
      },
    ];

    for (const config of llmConfigs) {
      await LLMConfig.upsert(config);
    }

    console.log('LLM configurations seeded successfully.');
  } catch (error) {
    console.error('Error seeding LLM configurations:', error);
  } finally {
    await sequelize.close();
  }
};

seedLLMConfig();