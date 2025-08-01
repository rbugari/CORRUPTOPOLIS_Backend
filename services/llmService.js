require('dotenv').config();

const getCorruptionOptions = async (level, category, language) => {
  // ... (lógica para llamar al LLM y obtener opciones)
};

const evaluatePlan = async (plan, option, tags, language) => {
  // ... (lógica para llamar al LLM y evaluar el plan)
};

module.exports = {
  getCorruptionOptions,
  evaluatePlan,
};
