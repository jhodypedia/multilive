const { sequelize, DataTypes } = require('../config/sequelize');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  channelId: { type: DataTypes.INTEGER, allowNull: false },
  // Format WIB "YYYY-MM-DD HH:mm:ss"
  startAtLocal: { type: DataTypes.STRING, allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, defaultValue: 60 }, // auto-stop
  notes: { type: DataTypes.STRING(255) }
}, { tableName: 'schedules' });

module.exports = Schedule;
