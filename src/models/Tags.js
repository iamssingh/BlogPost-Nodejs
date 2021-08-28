'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Tags extends Model {
        static associate(models) {
            // Tags.hasOne(models.TabParameters, {
            //     as: 'service_group_name',
            //     sourceKey: 'service_group_id',
            //     foreignKey: 'param_value',
            //     where: { param_key: 'service_group' }
            // });
            // Tags.hasOne(models.TabParameters, {
            //     as: 'service_name',
            //     foreignKey: 'param_value',
            //     sourceKey: 'service_id',
            //     where: { param_key: 'service_type' }
            // });
            // Tags.hasOne(models.TabParameters, {
            //     as: 'sub_service_name',
            //     foreignKey: 'param_value',
            //     sourceKey: 'sub_service_id',
            //     where: { param_key: 'sub_service' }
            // });
        }
    }

    Tags.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: { type: DataTypes.STRING, allowNull: false },
        details: { type: DataTypes.TEXT, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        sequelize,
        modelName: 'Tags',
        underscored: true,
        paranoid: true,
        timestamps: true,

        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        tableName: 'tags',
    });
    return Tags;
};