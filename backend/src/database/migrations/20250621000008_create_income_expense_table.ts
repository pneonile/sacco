/**
 * Migration: Create Income and Expense Table (Ledger Entries)
 * 
 * This migration creates the ledger_entries table for tracking all income and expenses
 * of the SACCO. It includes categorization, tax calculations, budget tracking,
 * vendor management, and approval workflow for financial governance.
 */
import { Knex } from 'knex';

// Transaction types enum
const TRANSACTION_TYPES = ['income', 'expense'];

// Approval status enum
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

// Payment methods enum
const PAYMENT_METHODS = ['cash', 'bank', 'mobile_money', 'check', 'electronic_transfer'];

export async function up(knex: Knex): Promise<void> {
  // Create categories table for income and expense categories
  await knex.schema.createTable('ledger_categories', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Category details
    table.string('name').notNullable();
    table.enum('type', TRANSACTION_TYPES).notNullable();
    table.string('code').nullable();
    table.text('description').nullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('display_order').defaultTo(0);
    
    // Parent category for hierarchical categorization
    table.uuid('parent_id').nullable().references('id').inTable('ledger_categories').onDelete('SET NULL');
    
    // Budget related fields
    table.decimal('annual_budget', 15, 2).nullable();
    table.decimal('monthly_budget', 15, 2).nullable();
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes
    table.index('name');
    table.index('type');
    table.index('code');
    table.index('parent_id');
    table.index('is_active');
    table.index('deleted_at');
    
    // Unique constraint for category name within same type
    table.unique(['name', 'type', 'deleted_at']);
  });
  
  // Create vendors/suppliers table
  await knex.schema.createTable('vendors', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Vendor details
    table.string('name').notNullable();
    table.string('contact_person').nullable();
    table.string('phone_number').nullable();
    table.string('email').nullable();
    table.text('address').nullable();
    table.string('tax_id').nullable();
    table.string('registration_number').nullable();
    table.string('bank_name').nullable();
    table.string('bank_account').nullable();
    table.boolean('is_active').defaultTo(true);
    
    // Vendor type and category
    table.string('vendor_type').nullable();
    table.string('category').nullable();
    
    // Payment terms
    table.integer('payment_terms_days').nullable();
    table.text('payment_instructions').nullable();
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes
    table.index('name');
    table.index('vendor_type');
    table.index('category');
    table.index('is_active');
    table.index('deleted_at');
    
    // Unique constraint
    table.unique(['name', 'deleted_at']);
  });
  
  // Create budget lines table
  await knex.schema.createTable('budget_lines', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Budget details
    table.string('name').notNullable();
    table.string('code').nullable();
    table.text('description').nullable();
    table.decimal('allocated_amount', 15, 2).notNullable();
    table.decimal('used_amount', 15, 2).defaultTo(0);
    table.decimal('remaining_amount', 15, 2).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    
    // Foreign key to category
    table.uuid('category_id').nullable().references('id').inTable('ledger_categories').onDelete('SET NULL');
    
    // Budget status and tracking
    table.boolean('is_active').defaultTo(true);
    table.decimal('utilization_percentage', 5, 2).defaultTo(0);
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes
    table.index('name');
    table.index('code');
    table.index('category_id');
    table.index('start_date');
    table.index('end_date');
    table.index('is_active');
    table.index('deleted_at');
    
    // Check constraints
    table.check('?? >= 0', ['allocated_amount']);
    table.check('?? >= 0', ['used_amount']);
    table.check('?? >= 0', ['remaining_amount']);
    table.check('?? <= ??', ['used_amount', 'allocated_amount']);
    table.check('?? = ?? - ??', ['remaining_amount', 'allocated_amount', 'used_amount']);
  });
  
  // Create main ledger entries table
  return knex.schema.createTable('ledger_entries', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Transaction details
    table.enum('type', TRANSACTION_TYPES).notNullable();
    table.uuid('category_id').references('id').inTable('ledger_categories').onDelete('SET NULL');
    table.decimal('amount', 15, 2).notNullable();
    table.text('description').notNullable();
    table.date('transaction_date').notNullable();
    
    // Reference and receipt information
    table.string('reference').nullable();
    table.string('receipt_number').nullable();
    table.string('receipt_url').nullable();
    table.boolean('has_receipt').defaultTo(false);
    
    // Tax information
    table.decimal('tax_amount', 15, 2).defaultTo(0);
    table.decimal('tax_rate', 6, 3).nullable();
    table.boolean('tax_exempt').defaultTo(false);
    table.string('tax_reference').nullable();
    
    // Budget tracking
    table.uuid('budget_line_id').nullable().references('id').inTable('budget_lines').onDelete('SET NULL');
    table.string('account_code').nullable();
    
    // Vendor/supplier information
    table.uuid('vendor_id').nullable().references('id').inTable('vendors').onDelete('SET NULL');
    table.string('vendor_name').nullable();
    table.string('vendor_reference').nullable();
    table.string('invoice_number').nullable();
    table.date('invoice_date').nullable();
    table.date('due_date').nullable();
    
    // Payment details
    table.enum('payment_method', PAYMENT_METHODS).nullable();
    table.string('payment_reference').nullable();
    table.boolean('is_paid').defaultTo(false);
    table.date('payment_date').nullable();
    table.string('check_number').nullable();
    
    // Approval workflow
    table.enum('approval_status', APPROVAL_STATUSES).defaultTo('pending');
    table.uuid('requested_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approval_date').nullable();
    table.text('approval_notes').nullable();
    table.text('rejection_reason').nullable();
    
    // Additional information
    table.jsonb('custom_fields').nullable();
    table.jsonb('attachments').defaultTo('[]');
    table.text('notes').nullable();
    table.boolean('is_recurring').defaultTo(false);
    table.string('recurrence_pattern').nullable();
    table.string('project_code').nullable();
    table.string('department_code').nullable();
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('type');
    table.index('category_id');
    table.index('transaction_date');
    table.index('reference');
    table.index('receipt_number');
    table.index('budget_line_id');
    table.index('vendor_id');
    table.index('invoice_number');
    table.index('payment_method');
    table.index('approval_status');
    table.index('requested_by');
    table.index('approved_by');
    table.index('project_code');
    table.index('department_code');
    table.index('deleted_at'); // For soft delete queries
    
    // Composite indexes for common queries
    table.index(['type', 'transaction_date']);
    table.index(['category_id', 'transaction_date']);
    table.index(['approval_status', 'transaction_date']);
    table.index(['vendor_id', 'transaction_date']);
    table.index(['budget_line_id', 'type']);
    
    // Check constraints
    table.check('?? > 0', ['amount']); // Amount must be positive
    table.check('?? >= 0', ['tax_amount']); // Tax amount must be non-negative
    table.check('((?? IS NULL) OR (?? >= 0))', ['tax_rate', 'tax_rate']); // Tax rate must be non-negative if provided
    table.check('(?? = ?) OR (?? = ?)', ['approval_status', 'approved', 'approved_by', null]); // If approved, must have approver
    table.check('(?? = ?) OR (?? IS NULL)', ['approval_status', 'rejected', 'rejection_reason']); // If rejected, must have reason
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('ledger_entries');
  await knex.schema.dropTableIfExists('budget_lines');
  await knex.schema.dropTableIfExists('vendors');
  return knex.schema.dropTableIfExists('ledger_categories');
}
