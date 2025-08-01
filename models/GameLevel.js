const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GameLevel = sequelize.define('GameLevel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  level_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  title_en: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  title_es: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  pc_required_for_ascension: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  pc_gain_factor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  inf_gain_factor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  character_image_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description_es: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'game_levels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = GameLevel;
