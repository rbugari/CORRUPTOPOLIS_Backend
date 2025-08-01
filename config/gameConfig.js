const GameConfig = require('../models/GameConfig');

let gameConfig = {};

const loadGameConfig = async () => {
  try {
    console.log('Cargando configuración del juego desde la base de datos...');
    const configs = await GameConfig.findAll();
    gameConfig = configs.reduce((acc, config) => {
      acc[config.config_key] = config.config_value;
      return acc;
    }, {});
    console.log('Configuración del juego cargada:', gameConfig);
  } catch (error) {
    console.error('Error al cargar la configuración del juego:', error);
    // En caso de error, podríamos querer usar valores por defecto o detener la aplicación
    process.exit(1);
  }
};

const getGameConfig = () => {
    return gameConfig;
}

module.exports = { loadGameConfig, getGameConfig };