/**
 * Migration: Create Accounts Table
 * 
 * This migration creates the accounts table which stores all member account information
 * including savings, fixed deposits, and special accounts. It includes balance tracking,
 * interest calculations, and account status management.
 */
import { Knex } from 'knex';

// Account types enum
const ACCOUNT_TYPES = ['savings', 'fixed', 'special'];

// Account status enum
const ACCOUNT_STATUSES = ['active', 'dormant', 'closed'];

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('accounts', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key to users table (member)
    table.uuid('member_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Account details
    table.enum('account_type', ACCOUNT_TYPES).notNullable();
    table.decimal('balance', 15, 2).notNullable().defaultTo(0);
    table.decimal('interest_rate', 6, 3).notNullable();
    table.date('opening_date').notNullable();
    table.date('last_transaction_date').notNullable();
    table.enum('status', ACCOUNT_STATUSES).notNullable().defaultTo('active');
    
    // Additional account details
    table.string('account_number').unique().notNullable();
    table.decimal('minimum_balance', 15, 2).defaultTo(0);
    table.decimal('interest_accrued', 15, 2).defaultTo(0);
    table.date('last_interest_calculation_date').nullable();
    table.date('maturity_date').nullable();
    table.boolean('auto_renew').defaultTo(false);
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('member_id');
    table.index('account_type');
    table.index('status');
    table.index('account_number');
    table.index('maturity_date');
    table.index('deleted_at'); // For soft delete queries
    
    // Composite indexes for common queries
    table.index(['member_id', 'account_type']);
    table.index(['member_id', 'status']);
    
    // Check constraints
    table.check('?? >= 0', ['balance']);
    table.check('?? >= 0', ['minimum_balance']);
    table.check('?? >= 0', ['interest_rate']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  return knex.schema.dropTableIfExists('accounts');
}
