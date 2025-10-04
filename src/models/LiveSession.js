const { sequelize, DataTypes } = require('../config/sequelize');

const LiveSession = sequelize.define('LiveSession', {
  id: { type: DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  channelId: { type: DataTypes.INTEGER, allowNull:false },
  status: { type: DataTypes.ENUM('idle','starting','streaming','stopped','error'), defaultValue:'idle' },
  currentItemId: { type: DataTypes.INTEGER },
  startedAt: { type: DataTypes.DATE },
  stoppedAt: { type: DataTypes.DATE },
  message: { type: DataTypes.TEXT },
  scheduleId: { type: DataTypes.INTEGER }
}, { tableName:'live_sessions' });

module.exports = LiveSession;
