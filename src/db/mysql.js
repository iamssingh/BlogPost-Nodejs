const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE,
    process.env.USERNAME,
    process.env.PASSWORD, {
        host: process.env.HOST,
        dialect: 'mysql',
    });
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = {
    sequelize,
};