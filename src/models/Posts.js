'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Posts extends Model {
        static associate(models) {}
    }
    Posts.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: { type: DataTypes.INTEGER, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        excerpt: { type: DataTypes.STRING, allowNull: false },
        active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
        deleted_by: { type: DataTypes.INTEGER, allowNull: true },
        updated_by: { type: DataTypes.INTEGER, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
        updated_at: { type: DataTypes.DATE, allowNull: true }
    }, {
        sequelize,
        modelName: 'Posts',
        underscored: true,
        paranoid: true,
        timestamps: true,

        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        tableName: 'posts',
    });
    return Posts;
};