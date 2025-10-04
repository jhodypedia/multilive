const { sequelize, DataTypes } = require('../config/sequelize');

const Schedule = sequelize.define('Schedule', {
  id: { type: DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  channelId: { type: DataTypes.INTEGER, allowNull:false },
  startAtLocal: { type: DataTypes.STRING, allowNull:false },
  durationMinutes: { type: DataTypes.INTEGER, defaultValue:60 },
  notes: { type: DataTypes.STRING }
}, { tableName:'schedules' });

module.exports = Schedule;
