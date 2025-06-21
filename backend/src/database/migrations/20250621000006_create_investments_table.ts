/**
 * Migration: Create Investments Table
 * 
 * This migration creates the investments table for tracking all SACCO investments
 * including fixed deposits, government bonds, treasury bills, real estate, and equity.
 * It includes investment tracking, returns calculation, and maturity management.
 */
import { Knex } from 'knex';

// Investment types enum
const INVESTMENT_TYPES = ['fixed_deposit', 'government_bonds', 'treasury_bills', 'real_estate', 'equity', 'other'];

// Investment status enum
const INVESTMENT_STATUSES = ['active', 'matured', 'sold'];

// Interest payment schedule enum
const INTEREST_PAYMENT_SCHEDULES = ['monthly', 'quarterly', 'biannual', 'annual', 'maturity'];

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('investments', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic investment details
    table.string('name').notNullable();
    table.enum('type', INVESTMENT_TYPES).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('interest_rate', 6, 3).notNullable();
    table.date('maturity_date').notNullable();
    table.decimal('current_value', 15, 2).notNullable();
    table.enum('status', INVESTMENT_STATUSES).notNullable().defaultTo('active');
    table.date('purchase_date').notNullable();
    
    // Additional investment details
    table.string('investment_number').unique().nullable();
    table.string('institution_name').nullable();
    table.string('institution_contact').nullable();
    table.jsonb('document_references').defaultTo('[]');
    table.enum('interest_payment_schedule', INTEREST_PAYMENT_SCHEDULES).nullable();
    table.date('last_interest_payment_date').nullable();
    table.date('next_interest_payment_date').nullable();
    table.decimal('interest_earned', 15, 2).defaultTo(0);
    table.decimal('interest_paid', 15, 2).defaultTo(0);
    table.decimal('sale_value', 15, 2).nullable();
    table.date('sale_date').nullable();
    table.decimal('profit_loss', 15, 2).nullable();
    
    // Approval and audit fields
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('name');
    table.index('type');
    table.index('status');
    table.index('maturity_date');
    table.index('purchase_date');
    table.index('deleted_at'); // For soft delete queries
    
    // Composite indexes for common queries
    table.index(['status', 'maturity_date']);
    table.index(['type', 'status']);
    
    // Check constraints
    table.check('?? >= 0', ['amount']);
    table.check('?? >= 0', ['interest_rate']);
    table.check('?? >= 0', ['current_value']);
    table.check('?? >= 0', ['interest_earned']);
    table.check('?? >= 0', ['interest_paid']);
    
    // Sale constraints
    table.check('(?? IS NULL) OR (?? IS NOT NULL)', ['sale_date', 'sale_value']);
    table.check('(?? != ?) OR (?? IS NOT NULL)', ['status', 'sold', 'sale_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  return knex.schema.dropTableIfExists('investments');
}
