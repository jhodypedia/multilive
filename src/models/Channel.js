const { sequelize, DataTypes } = require('../config/sequelize');

const Channel = sequelize.define('Channel', {
  id: { type: DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  name: { type: DataTypes.STRING, allowNull:false },
  rtmpUrl: { type: DataTypes.STRING(768), allowNull:false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue:true },
  videoBitrate: { type: DataTypes.STRING, defaultValue: process.env.DEFAULT_VIDEO_BITRATE },
  audioBitrate: { type: DataTypes.STRING, defaultValue: process.env.DEFAULT_AUDIO_BITRATE },
  resolution: { type: DataTypes.STRING, defaultValue: process.env.DEFAULT_RESOLUTION },
  framerate: { type: DataTypes.INTEGER, defaultValue: Number(process.env.DEFAULT_FRAMERATE) }
}, { tableName:'channels' });

module.exports = Channel;
