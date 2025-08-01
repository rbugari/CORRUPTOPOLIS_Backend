const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LLMCardGenerationHistory = sequelize.define('LLMCardGenerationHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // This is the table name
      key: 'id',
    },
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  prompt_sent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  llm_response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cards_generated: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'llm_card_generation_history',
  timestamps: false,
});

module.exports = LLMCardGenerationHistory;
