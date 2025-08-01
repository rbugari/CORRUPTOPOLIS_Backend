const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const UserGameState = sequelize.define('UserGameState', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  pc: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  inf: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  be: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'user_gamestate',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: false,
});

User.hasOne(UserGameState, { foreignKey: 'user_id' });
UserGameState.belongsTo(User, { foreignKey: 'user_id' });

module.exports = UserGameState;
