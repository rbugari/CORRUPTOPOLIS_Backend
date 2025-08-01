const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LLMConfig = sequelize.define('LLMConfig', {
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
    defaultValue: 0.7, // Default temperature
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  llm_api_key: {
    type: DataTypes.STRING(255),
    allowNull: true, // Allow null for now, will be populated by seeders
  },
  max_tokens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2048,
  },
}, {
  tableName: 'llm_config',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = LLMConfig;
