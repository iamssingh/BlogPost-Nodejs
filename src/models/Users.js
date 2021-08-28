'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Users extends Model {
        static associate(models) {
            // Users.hasOne(models.UserDetails, {
            //     as: 'user_details',
            //     sourceKey: 'user_id',
            //     foreignKey: 'user_id',
            // });
        }
    }

    Users.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        api_token: { type: DataTypes.TEXT, allowNull: true},
        name: { type: DataTypes.STRING, allowNull: false},
        email: { type: DataTypes.STRING, allowNull: true, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        username: { type: DataTypes.STRING, allowNull: false, unique: true },
        profile_pic: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('admin','user'), allowNull: false },
        active: { type: DataTypes.TINYINT, allowNull: false },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
        updated_at: { type: DataTypes.DATE, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    }, {
        sequelize,
        modelName: 'Users',
        underscored: true,
        paranoid: true,
        timestamps: true,

        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        tableName: 'users',
    });
    return Users;
};