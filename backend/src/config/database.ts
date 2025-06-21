/**
 * Kawempe SACCO - Database Configuration
 * 
 * This file configures the database connection using Knex.js and Objection.js ORM.
 * It handles different environments, connection pooling, and exports the configured
 * database instances for use throughout the application.
 */

import { knex, Knex } from 'knex';
import { Model } from 'objection';
import dotenv from 'dotenv';
import path from 'path';
import { Logger } from 'winston';
import winston from 'winston';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Database connection configuration
const dbConfig: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'kawempe_sacco',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      // Development specific settings
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
      directory: path.join(__dirname, '../database/migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../database/seeds'),
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
      directory: path.join(__dirname, '../database/migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../database/seeds/test'),
      extension: 'ts',
    },
    // Disable query logging during tests
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
      // SSL configuration for production
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.DB_SSL_CA ? Buffer.from(process.env.DB_SSL_CA, 'base64').toString('ascii') : undefined,
        key: process.env.DB_SSL_KEY ? Buffer.from(process.env.DB_SSL_KEY, 'base64').toString('ascii') : undefined,
        cert: process.env.DB_SSL_CERT ? Buffer.from(process.env.DB_SSL_CERT, 'base64').toString('ascii') : undefined,
      },
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      propagateCreateError: false,
      acquireTimeoutMillis: 60000,
    },
    migrations: {
      directory: path.join(__dirname, '../database/migrations'),
      tableName: 'knex_migrations',
      extension: 'js', // Use compiled JS in production
    },
    // No seeds in production by default
    debug: false,
  }
};

// Initialize logger
const logger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create the knex instance with the appropriate configuration
const environment = isTest ? 'test' : (isProduction ? 'production' : 'development');
const db = knex(dbConfig[environment]);

// Set up Objection.js with our Knex instance
Model.knex(db);

/**
 * Base model class that all models should extend
 * Provides common functionality and type safety
 */
export class BaseModel extends Model {
  // Common fields for all models
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  // Add timestamps before insert
  $beforeInsert(): void {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Update the updated_at timestamp before update
  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  // Soft delete method
  async softDelete(): Promise<void> {
    await this.$query().patch({
      deletedAt: new Date(),
    });
  }

  // Static query builder that automatically filters out soft-deleted records
  static get queryBuilder() {
    return this.query().whereNull('deletedAt');
  }
}

/**
 * Tests the database connection
 * @returns Promise that resolves if connection is successful, rejects otherwise
 */
export const testConnection = async (): Promise<void> => {
  try {
    // Test query to check if connection is working
    const result = await db.raw('SELECT 1+1 AS result');
    logger.info(`Database connection successful (${environment} environment)`);
    return Promise.resolve();
  } catch (error) {
    logger.error('Database connection failed:', error);
    return Promise.reject(error);
  }
};

/**
 * Initializes the database connection and runs migrations if needed
 * @param shouldRunMigrations Whether to run migrations during initialization
 * @returns Promise that resolves when initialization is complete
 */
export const initializeDatabase = async (shouldRunMigrations = !isProduction): Promise<void> => {
  try {
    // Test connection first
    await testConnection();

    // Run migrations if needed
    if (shouldRunMigrations) {
      logger.info('Running database migrations...');
      await db.migrate.latest();
      logger.info('Database migrations completed successfully');
    }

    return Promise.resolve();
  } catch (error) {
    logger.error('Database initialization failed:', error);
    return Promise.reject(error);
  }
};

// Export the configured instances
export { db, Model };
export default db;
