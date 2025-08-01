const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('game_config', 'config_value', {
      type: DataTypes.TEXT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('game_config', 'config_value', {
      type: DataTypes.STRING(255),
      allowNull: false,
    });
  }
};