const { sequelize } = require('../config/db');
const GameLevel = require('../models/GameLevel');

const gameLevelsData = [
  {
    level_number: 1,
    title_en: 'Municipal Councilman',
    title_es: 'Concejal Municipal',
    pc_required_for_ascension: 100,
    pc_gain_factor: 3,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_1.png',
    description_en: 'Ragged, hungry, with a cunning look.',
    description_es: 'Andrajoso, hambriento, con una mirada astuta.'
  },
  {
    level_number: 2,
    title_en: 'Provincial Deputy',
    title_es: 'Diputado Provincial',
    pc_required_for_ascension: 250,
    pc_gain_factor: 4,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_2.png',
    description_en: 'Cheap but new suit, a little more weight, forced smile.',
    description_es: 'Traje barato pero nuevo, un poco más de peso, sonrisa forzada.'
  },
  {
    level_number: 3,
    title_en: 'Regional Governor',
    title_es: 'Gobernador Regional',
    pc_required_for_ascension: 400,
    pc_gain_factor: 4,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_3.png',
    description_en: 'Tailored suit, visible watch, smug expression.',
    description_es: 'Traje a medida, reloj visible, expresión de suficiencia.'
  },
  {
    level_number: 4,
    title_en: 'National Senator',
    title_es: 'Senador Nacional',
    pc_required_for_ascension: 550,
    pc_gain_factor: 4,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_4.png',
    description_en: 'Luxury brand suit, arrogantly gesticulating, impeccable hairstyle.',
    description_es: 'Traje de marca de lujo, gesticula con arrogancia, peinado impecable.'
  },
  {
    level_number: 5,
    title_en: 'Cabinet Minister',
    title_es: 'Ministro de Gabinete',
    pc_required_for_ascension: 700,
    pc_gain_factor: 4,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_5.png',
    description_en: 'Discreet but evident opulence, condescending gaze.',
    description_es: 'Opulencia discreta pero evidente, mirada condescendiente.'
  },
  {
    level_number: 6,
    title_en: 'Vice President',
    title_es: 'Vicepresidente',
    pc_required_for_ascension: 850,
    pc_gain_factor: 4,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_6.png',
    description_en: 'Blatant opulence, surrounded by fearful advisors and bodyguards.',
    description_es: 'Opulencia descarada, rodeado de asesores y guardaespaldas temerosos.'
  },
  {
    level_number: 7,
    title_en: 'President/Prime Minister',
    title_es: 'Presidente/Primer Ministro',
    pc_required_for_ascension: 1000,
    pc_gain_factor: 4,
    inf_gain_factor: 1,
    character_image_url: '/images/avatar_level_7.png',
    description_en: 'Statesman-like appearance, with presidential sash, false smile.',
    description_es: 'Apariencia de estadista, con banda presidencial, sonrisa falsa.'
  }
];

const seedGameLevels = async () => {
  try {
    await sequelize.sync({ alter: true }); // Sincroniza los modelos, alterando la tabla si es necesario

    for (const levelData of gameLevelsData) {
      const [level, created] = await GameLevel.findOrCreate({
        where: { level_number: levelData.level_number },
        defaults: levelData
      });

      if (created) {
        console.log(`Nivel ${level.level_number} (${level.title_es}) creado.`);
      } else {
        // Si el nivel ya existe, actualiza sus datos
        await GameLevel.update(levelData, { where: { level_number: levelData.level_number } });
        console.log(`Nivel ${level.level_number} (${level.title_es}) actualizado.`);
      }
    }

    console.log('Seeding de niveles de juego completado.');
  } catch (error) {
    console.error('Error durante el seeding de niveles de juego:', error);
  } finally {
    await sequelize.close();
  }
};

seedGameLevels();