const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const LLMInteractionHistory = sequelize.define('LLMInteractionHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  level: {
    type: DataTypes.INTEGER,
  },
  action_title: {
    type: DataTypes.STRING,
  },
  narrated_plan_text: {
    type: DataTypes.TEXT,
  },
  llm_evaluation_json: {
    type: DataTypes.JSON,
  },
  llm_advice_json: {
    type: DataTypes.JSON,
  },
}, {
  tableName: 'llm_interactions_history',
  timestamps: false,
});

User.hasMany(LLMInteractionHistory, { foreignKey: 'user_id' });
LLMInteractionHistory.belongsTo(User, { foreignKey: 'user_id' });

module.exports = LLMInteractionHistory;
