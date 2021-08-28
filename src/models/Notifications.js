'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notifications extends Model {
    static associate(models) {}
  }

  Notifications.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      post_id: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.ENUM('dispatched', 'clicked'), allowNull: false, default:'dispatched'},
      timestamp: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Notifications',

      underscored: true,
      paranoid: true,
      timestamps: true,

      createdAt: 'timestamp',
      tableName: 'notifications',
    }
  );
  return Notifications;
};
