const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar_url: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  selected_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
  },
  country_of_origin: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  political_ideology: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  personal_profile: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  email_verification_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_login_timestamp: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rescatePago: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tipo_invitado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  terms_accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  has_won: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
