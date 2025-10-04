const { sequelize, DataTypes } = require('../config/sequelize');

const PlaylistItem = sequelize.define('PlaylistItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  // Path absolut file MP4 lokal (disarankan) atau URL (mp4/hls)
  source: { type: DataTypes.STRING(1024), allowNull: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'playlist_items' });

module.exports = PlaylistItem;
