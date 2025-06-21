/**
 * Migration: Create Loan Products Table
 * 
 * This migration creates the loan_products table which defines the different types of loans
 * offered by the SACCO, including their terms, interest rates, fees, and eligibility criteria.
 * Each loan application will reference a loan product.
 */
import { Knex } from 'knex';

// Loan types enum
const LOAN_TYPES = ['emergency', 'development', 'education', 'business', 'other'];

// Status enum
const STATUSES = ['active', 'inactive'];

// Repayment frequency enum
const REPAYMENT_FREQUENCIES = ['weekly', 'biweekly', 'monthly'];

// Interest type enum
const INTEREST_TYPES = ['flat', 'reducing_balance'];

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loan_products', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic loan product details
    table.string('name').notNullable();
    table.enum('loan_type', LOAN_TYPES).notNullable();
    table.decimal('max_amount', 15, 2).notNullable();
    table.decimal('min_amount', 15, 2).notNullable();
    table.decimal('interest_rate', 6, 3).notNullable();
    table.integer('term_months').notNullable();
    table.text('eligibility_rules').notNullable();
    table.boolean('collateral_required').notNullable().defaultTo(false);
    table.enum('status', STATUSES).notNullable().defaultTo('active');
    
    // Fee structure
    table.decimal('processing_fee_percentage', 5, 2).nullable();
    table.decimal('processing_fee_fixed', 15, 2).nullable();
    table.decimal('late_payment_fee_percentage', 5, 2).nullable();
    table.decimal('late_payment_fee_fixed', 15, 2).nullable();
    table.decimal('early_repayment_fee_percentage', 5, 2).nullable();
    
    // Payment terms
    table.integer('grace_period_days').nullable();
    table.enum('repayment_frequency', REPAYMENT_FREQUENCIES).defaultTo('monthly');
    table.enum('interest_type', INTEREST_TYPES).defaultTo('reducing_balance');
    
    // Eligibility criteria
    table.integer('min_credit_score').nullable();
    table.integer('min_membership_duration').nullable().comment('In months');
    table.integer('guarantors_required').nullable().defaultTo(0);
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('name');
    table.index('loan_type');
    table.index('status');
    table.index('deleted_at'); // For soft delete queries
    
    // Check constraints
    table.check('?? >= 0', ['interest_rate']);
    table.check('?? >= 0', ['min_amount']);
    table.check('?? >= 0', ['max_amount']);
    table.check('?? >= ??', ['max_amount', 'min_amount']);
    table.check('?? > 0', ['term_months']);
    
    // Unique constraint
    table.unique(['name', 'deleted_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  return knex.schema.dropTableIfExists('loan_products');
}
