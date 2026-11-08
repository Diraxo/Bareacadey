const db = require('../database')
const Sequelize = require('sequelize')

const Activity = db.define('Activity', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    activity: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING(30),
        allowNull: false,
    }
})
module.exports = Activity