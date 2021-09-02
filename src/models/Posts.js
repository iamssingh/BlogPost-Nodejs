'use strict';
const { Model } = require('sequelize');
// const PostTags = require('./').PostTags;
module.exports = (sequelize, DataTypes) => {
    class Posts extends Model {
        static associate(models) {
            Posts.belongsTo(models.Users, {
                foreignKey: 'created_by',
                as: 'created_by_user',
                primaryKey: 'id',
            });
            Posts.belongsToMany(models.Tags, {
                through: models.PostTags,
                // foreignKey: 'id',
                as: 'tags',
                uniqueKey: 'post_id',
            });
        }
    }
    Posts.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: { type: DataTypes.INTEGER, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        slug: { type: DataTypes.STRING, allowNull: false },
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
    Posts.addTags = (tags) =>{
        return sequelize.models.PostTags.bulkCreate(tags);
    }
    return Posts;
};