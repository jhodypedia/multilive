const { sequelize, DataTypes } = require('../config/sequelize');

const PlaylistItem = sequelize.define('PlaylistItem', {
  id: { type: DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  title: { type: DataTypes.STRING, allowNull:false },
  source: { type: DataTypes.STRING(1024), allowNull:false },
  order: { type: DataTypes.INTEGER, defaultValue:0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue:true },
  loop: { type: DataTypes.BOOLEAN, defaultValue:true } // Yes/No
}, { tableName:'playlist_items' });

module.exports = PlaylistItem;
