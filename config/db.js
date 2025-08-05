const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';

const dbConfig = {
  development: {
    database: process.env.DB_NAME_DEV,
    username: process.env.DB_USER_DEV,
    password: process.env.DB_PASSWORD_DEV,
    host: process.env.DB_HOST_DEV,
    port: process.env.DB_PORT_DEV || 3306,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    database: process.env.DB_NAME_PROD,
    username: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT_PROD || 3306,
    dialect: 'mysql',
    logging: false,
  },
};

const sequelize = new Sequelize(
  dbConfig[env].database,
  dbConfig[env].username,
  dbConfig[env].password,
  {
    host: dbConfig[env].host,
    port: dbConfig[env].port,
    dialect: dbConfig[env].dialect,
    logging: dbConfig[env].logging,
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected to ${env} database...`);
    console.log('All models synchronized with database.');
  } catch (error) {
    console.error('Unable to connect to the database or synchronize models:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };