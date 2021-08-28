'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Followups extends Model {
    static associate(models) {
      // Followups.hasMany(models.Followups, {
      //   as: 'sub_tickets',
      //   sourceKey: 'ticket_id',
      //   foreignKey: 'parent_id',
      //   required: false,
      // });
      // Followups.belongsTo(models.TabParameters, {
      //   as: 'ticket_status',
      //   targetKey: 'param_value',
      //   foreignKey: 'status',
      //   where: { param_key: 'ticket_status' },
      // });
    }
  }

  Followups.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      follower_id: { type: DataTypes.INTEGER, allowNull: false },
      timestamp: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Followups',
      underscored: true,
      paranoid: false,
      timestamps: true,

      createdAt: 'timestamp',
      tableName: 'followups',
    }
  );
  return Followups;
};
