/**
 * Migration: Create Loans Table
 * 
 * This migration creates the loans table which stores all loan information including
 * application details, approval status, disbursement information, and repayment tracking.
 * It includes relationships to members, loan products, and guarantors.
 */
import { Knex } from 'knex';

// Loan types enum
const LOAN_TYPES = ['emergency', 'development', 'education', 'business', 'other'];

// Loan status enum
const LOAN_STATUSES = ['pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted', 'rejected'];

// Risk rating enum
const RISK_RATINGS = ['low', 'medium', 'high'];

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loans', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign keys
    table.uuid('member_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('loan_product_id').references('id').inTable('loan_products').onDelete('RESTRICT');
    
    // Basic loan details
    table.enum('loan_type', LOAN_TYPES).notNullable();
    table.decimal('principal_amount', 15, 2).notNullable();
    table.decimal('interest_rate', 6, 3).notNullable();
    table.integer('term_months').notNullable();
    table.decimal('monthly_payment', 15, 2).notNullable();
    table.decimal('outstanding_balance', 15, 2).notNullable();
    table.date('application_date').notNullable();
    table.date('approval_date').nullable();
    table.date('disbursement_date').nullable();
    table.enum('status', LOAN_STATUSES).notNullable().defaultTo('pending');
    table.jsonb('guarantors').defaultTo('[]');
    table.text('purpose').notNullable();
    table.boolean('collateral_required').notNullable().defaultTo(false);
    
    // Loan identification
    table.string('loan_number').unique().notNullable();
    table.text('collateral_description').nullable();
    table.decimal('collateral_value', 15, 2).nullable();
    table.jsonb('collateral_documents').defaultTo('[]');
    
    // Approval and disbursement details
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('rejection_reason').nullable();
    table.uuid('disbursed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Payment tracking
    table.date('next_payment_date').nullable();
    table.decimal('next_payment_amount', 15, 2).nullable();
    table.decimal('total_interest_payable', 15, 2).nullable();
    table.decimal('total_amount_payable', 15, 2).nullable();
    table.decimal('paid_principal', 15, 2).defaultTo(0);
    table.decimal('paid_interest', 15, 2).defaultTo(0);
    table.decimal('remaining_principal', 15, 2).nullable();
    table.decimal('remaining_interest', 15, 2).nullable();
    table.decimal('late_payment_fee_rate', 5, 2).nullable();
    
    // Risk assessment
    table.enum('risk_rating', RISK_RATINGS).nullable();
    table.integer('credit_score').nullable();
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('member_id');
    table.index('loan_product_id');
    table.index('loan_type');
    table.index('status');
    table.index('application_date');
    table.index('approval_date');
    table.index('disbursement_date');
    table.index('next_payment_date');
    table.index('loan_number');
    table.index('deleted_at'); // For soft delete queries
    
    // Composite indexes for common queries
    table.index(['member_id', 'status']);
    table.index(['status', 'next_payment_date']);
    table.index(['approved_by', 'approval_date']);
    
    // Check constraints
    table.check('?? >= 0', ['principal_amount']);
    table.check('?? >= 0', ['interest_rate']);
    table.check('?? > 0', ['term_months']);
    table.check('?? >= 0', ['monthly_payment']);
    table.check('?? >= 0', ['outstanding_balance']);
    table.check('?? >= 0', ['paid_principal']);
    table.check('?? >= 0', ['paid_interest']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  return knex.schema.dropTableIfExists('loans');
}
