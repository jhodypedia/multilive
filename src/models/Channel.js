const { sequelize, DataTypes } = require('../config/sequelize');

const Channel = sequelize.define('Channel', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(128), allowNull: false },
  // Contoh RTMP: rtmp://a.rtmp.youtube.com/live2/STREAM_KEY
  rtmpUrl: { type: DataTypes.STRING(768), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  videoBitrate: { type: DataTypes.STRING, defaultValue: process.env.DEFAULT_VIDEO_BITRATE || '3500k' },
  audioBitrate: { type: DataTypes.STRING, defaultValue: process.env.DEFAULT_AUDIO_BITRATE || '160k' },
  resolution:  { type: DataTypes.STRING, defaultValue: process.env.DEFAULT_RESOLUTION || '1280x720' },
  framerate:   { type: DataTypes.INTEGER, defaultValue: Number(process.env.DEFAULT_FRAMERATE || 30) }
}, { tableName: 'channels' });

module.exports = Channel;
