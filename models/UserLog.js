const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const UserLog = sequelize.define('UserLog', {
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
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: true, // Can be null for events not directly tied to a level
  },
  pc_change: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  inf_change: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  be_change: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  action_title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pc_current: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  inf_current: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  be_current: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'user_logs',
  timestamps: false,
});

User.hasMany(UserLog, { foreignKey: 'user_id' });
UserLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = UserLog;