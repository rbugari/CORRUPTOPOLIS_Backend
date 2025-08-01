const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('game_config', 'config_value');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('game_config', 'config_value', {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '' // Or a suitable default value
    });
  }
};