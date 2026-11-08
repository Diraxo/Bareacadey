const Sequelize = require('sequelize')
const sequelize = require('../database')

/* Portable "column contains text" predicate. `!` is the escape character because `\` means different things in
 * MySQL and SQLite string literals; with ESCAPE '!' the pattern is matched literally on both. */
const containsText = (column, text) => {
  const escaped = String(text).replace(/[!%_]/g, (c) => '!' + c)
  return Sequelize.literal(`${column} LIKE ${sequelize.escape('%' + escaped + '%')} ESCAPE '!'`)
}

module.exports = { containsText }
