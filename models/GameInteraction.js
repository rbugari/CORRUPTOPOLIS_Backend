const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const GameInteraction = sequelize.define('GameInteraction', {
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  corruptionCategory: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  chosenOption: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  playerNarrative: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  llmEvaluation: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  llmAdvice: {
    type: DataTypes.TEXT,
  },
  resourcesGained: {
    type: DataTypes.JSON,
  },
});

User.hasMany(GameInteraction);
GameInteraction.belongsTo(User);

module.exports = GameInteraction;