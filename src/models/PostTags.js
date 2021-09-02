'use strict';
const { Model } = require('sequelize');
const Posts = require('./Posts');
const Tags = require('./Tags');

module.exports = (sequelize, DataTypes) => {
  class PostTags extends Model {
    static associate(models) {
      // PostTags.belongsTo(models.ClientCustomerMst, {
      //     foreignKey: 'client_cust_id',
      //     primaryKey:'clients_cust_id',
      //     as: 'customer_details',
      // });
      // PostTags.belongsTo(models.TicketMst, {
      //   foreignKey: 'ticket_id',
      //   primaryKey:'ticket_id',
      //   as: 'ticket_details',
      // });
    }
  }
  PostTags.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      post_id: { type: DataTypes.INTEGER, allowNull: false,references: {model:Posts,key:'id'}},
      tag_id: { type: DataTypes.INTEGER, allowNull: false ,references: {model:Tags,key:'id'}},
    },
    {
      sequelize,
      modelName: 'PostTags',
      underscored: true,
      timestamps: false,

      tableName: 'post_tags',
    }
  );
  return PostTags;
};
