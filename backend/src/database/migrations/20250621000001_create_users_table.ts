/**
 * Migration: Create Users Table
 * 
 * This migration creates the users table which is the foundation of the authentication
 * and authorization system. It includes all necessary fields for user management,
 * authentication, and role-based access control.
 */
import { Knex } from 'knex';

// User roles enum
const USER_ROLES = ['admin', 'staff', 'member'];

// User status enum
const USER_STATUSES = ['active', 'inactive', 'suspended'];

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  return knex.schema.createTable('users', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic information
    table.string('email').notNullable().unique();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.enum('role', USER_ROLES).notNullable();
    table.string('member_number').unique().nullable();
    table.string('phone_number').notNullable();
    table.string('id_number').notNullable();
    table.text('address').notNullable();
    table.string('employer_name').nullable();
    table.date('join_date').notNullable();
    table.enum('status', USER_STATUSES).notNullable().defaultTo('active');
    table.string('profile_image').nullable();
    
    // Authentication fields
    table.string('password').notNullable();
    table.string('password_reset_token').nullable();
    table.timestamp('password_reset_expires').nullable();
    table.timestamp('last_login_at').nullable();
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until').nullable();
    
    // Verification and security
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret').nullable();
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('email');
    table.index('member_number');
    table.index('role');
    table.index('status');
    table.index('deleted_at'); // For soft delete queries
    table.index(['first_name', 'last_name']); // For name searches
    table.index('phone_number');
    table.index('id_number');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  return knex.schema.dropTableIfExists('users');
}
