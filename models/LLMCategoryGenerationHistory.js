const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LLMCategoryGenerationHistory = sequelize.define('LLMCategoryGenerationHistory', {
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
  categories_generated: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'llm_category_generation_history',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
});

module.exports = LLMCategoryGenerationHistory;