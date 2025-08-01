const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('llm_configs', {
      config_name: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      system_prompt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      human_prompt: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      model_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      temperature: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.7,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      llm_api_key: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('llm_configs');
  }
};