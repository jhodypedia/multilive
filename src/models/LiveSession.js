const { sequelize, DataTypes } = require('../config/sequelize');

const LiveSession = sequelize.define('LiveSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  channelId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('idle','starting','streaming','stopping','stopped','error'), defaultValue: 'idle' },
  currentItemId: { type: DataTypes.INTEGER, allowNull: true },
  startedAt: { type: DataTypes.DATE, allowNull: true },
  stoppedAt: { type: DataTypes.DATE, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  scheduleId: { type: DataTypes.INTEGER, allowNull: true } // jika dari schedule
}, { tableName: 'live_sessions' });

module.exports = LiveSession;
