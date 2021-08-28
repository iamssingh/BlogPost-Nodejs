'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ActivityTracking extends Model {
        static associate(models) {
            // ActivityTracking.hasOne(models.TabParameters, {
            //     as: 'service_name',
            //     foreignKey: 'param_value',
            //     sourceKey: 'service_id',
            //     where: { param_key: 'service_type' }
            // });
        }
    }

    ActivityTracking.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        post_id: { type: DataTypes.INTEGER, allowNull: false },
        activity: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.STRING, allowNull: false },
        timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        sequelize,
        modelName: 'ActivityTracking',
        underscored: true,
        timestamps: true,

        createdAt: 'timestamp',
        tableName: 'activity_tracking',
    });
    return ActivityTracking;
};