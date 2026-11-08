const db = require('../database')
const Sequelize = require('sequelize')

const User = db.define('User', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    full_name: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false,
        defaultValue: '',
        autoIncrement: false,
    },
    username: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
        autoIncrement: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
        autoIncrement: false,
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false,
        defaultValue: '',
        autoIncrement: false,
    },
    password: {
        type: Sequelize.STRING,
    },
    about_me: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '',
    },

    gender: {
        type: Sequelize.ENUM("Male", "Female", "Other"),
        defaultValue: 'Male',
    },
    date_of_birth: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
    },
    refresh_token: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
    },
    reset_password_token: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
    },
    registration_token: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
    },
    confirmation_token: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    custom_fields: {
        type: Sequelize.TEXT,
        defaultValue: "[]"
    },






})
module.exports = User