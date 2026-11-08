/* Loads .env for real runs. Tests never read it: they must not see (or accidentally use) real credentials. */
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config()
}
