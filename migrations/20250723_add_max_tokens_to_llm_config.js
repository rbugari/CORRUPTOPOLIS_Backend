const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('llm_configs', 'max_tokens', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2048,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('llm_configs', 'max_tokens');
  }
};