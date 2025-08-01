const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GameConfig = sequelize.define('GameConfig', {
  config_key: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
  },
  config_value: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'game_config',
  timestamps: true,
  createdAt: false, // No necesitamos createdAt para configuraciones que se actualizan
  updatedAt: 'updated_at',
});

module.exports = GameConfig;
