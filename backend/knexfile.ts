/**
 * Knex Configuration File
 * 
 * This file configures Knex.js for CLI operations like migrations and seeds.
 * It exports the same database configuration used in the application but
 * formatted for the Knex CLI tools.
 */

import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Database configuration
const config = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'kawempe_sacco',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      charset: 'utf8',
      timezone: 'UTC',
      application_name: 'kawempe_sacco_dev',
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
      propagateCreateError: false,
      acquireTimeoutMillis: 30000,
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
      extension: 'ts',
    },
    debug: process.env.DB_DEBUG === 'true',
  },
  
  test: {
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
      database: process.env.TEST_DB_NAME || 'kawempe_sacco_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      charset: 'utf8',
      timezone: 'UTC',
      application_name: 'kawempe_sacco_test',
    },
    pool: {
      min: 1,
      max: 5,
      idleTimeoutMillis: 5000,
      propagateCreateError: false,
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds/test'),
      extension: 'ts',
    },
    debug: false,
  },
  
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      charset: 'utf8',
      timezone: 'UTC',
      application_name: 'kawempe_sacco_prod',
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.DB_SSL_CA ? Buffer.from(process.env.DB_SSL_CA, 'base64').toString('ascii') : undefined,
        key: process.env.DB_SSL_KEY ? Buffer.from(process.env.DB_SSL_KEY, 'base64').toString('ascii') : undefined,
        cert: process.env.DB_SSL_CERT ? Buffer.from(process.env.DB_SSL_CERT, 'base64').toString('ascii') : undefined,
      } : undefined,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      propagateCreateError: false,
      acquireTimeoutMillis: 60000,
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
      extension: 'js', // Use compiled JS in production
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
      extension: 'js', // Use compiled JS in production
    },
    debug: false,
  }
};

// Export the configuration for Knex CLI
module.exports = config;
