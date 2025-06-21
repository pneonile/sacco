/**
 * Migration: Create Transactions Table
 * 
 * This migration creates the transactions table which is the core of the financial system.
 * It stores all financial movements including deposits, withdrawals, loan payments, fines,
 * checkoffs, and transfers. It includes relationships to members, accounts, and loans.
 */
import { Knex } from 'knex';

// Transaction types enum
const TRANSACTION_TYPES = ['deposit', 'withdrawal', 'loan_payment', 'fine', 'checkoff', 'transfer', 'interest', 'fee'];

// Transaction status enum
const TRANSACTION_STATUSES = ['pending', 'completed', 'failed', 'reversed'];

// Transaction channels enum
const TRANSACTION_CHANNELS = ['cash', 'bank', 'mobile_money', 'checkoff', 'internal'];

// Mobile money providers enum
const MOBILE_MONEY_PROVIDERS = ['mtn', 'airtel'];

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transactions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign keys
    table.uuid('member_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('account_id').nullable().references('id').inTable('accounts').onDelete('SET NULL');
    table.uuid('loan_id').nullable().references('id').inTable('loans').onDelete('SET NULL');
    
    // Transaction details
    table.enum('type', TRANSACTION_TYPES).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.text('description').notNullable();
    table.date('date').notNullable();
    table.enum('status', TRANSACTION_STATUSES).notNullable().defaultTo('pending');
    table.string('reference').notNullable();
    table.enum('channel', TRANSACTION_CHANNELS).notNullable();
    
    // Mobile money specific fields
    table.enum('mobile_money_provider', MOBILE_MONEY_PROVIDERS).nullable();
    table.string('phone_number').nullable();
    table.decimal('fees', 15, 2).nullable().defaultTo(0);
    
    // Additional transaction details
    table.string('transaction_code').nullable();
    table.string('receipt_number').nullable();
    table.decimal('balance_before', 15, 2).nullable();
    table.decimal('balance_after', 15, 2).nullable();
    
    // Reversal and related transaction tracking
    table.text('reversal_reason').nullable();
    table.uuid('reversal_transaction_id').nullable().references('id').inTable('transactions').onDelete('SET NULL');
    table.uuid('related_transaction_id').nullable().references('id').inTable('transactions').onDelete('SET NULL');
    table.decimal('processing_fee', 15, 2).nullable().defaultTo(0);
    
    // Bank transfer details
    table.string('bank_name').nullable();
    table.string('account_number').nullable();
    table.string('cheque_number').nullable();
    
    // External reference for mobile money and other integrations
    table.string('external_reference').nullable();
    table.jsonb('external_data').nullable();
    
    // Approval and processing details
    table.uuid('processed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('member_id');
    table.index('account_id');
    table.index('loan_id');
    table.index('type');
    table.index('status');
    table.index('date');
    table.index('channel');
    table.index('reference');
    table.index('receipt_number');
    table.index('transaction_code');
    table.index('external_reference');
    table.index('deleted_at'); // For soft delete queries
    
    // Composite indexes for common financial queries
    table.index(['member_id', 'type']);
    table.index(['member_id', 'date']);
    table.index(['account_id', 'date']);
    table.index(['loan_id', 'date']);
    table.index(['type', 'status', 'date']);
    table.index(['channel', 'date']);
    table.index(['mobile_money_provider', 'status']);
    
    // Financial integrity constraints
    table.check('?? > 0', ['amount']); // Transactions must have positive amount
    table.check('((?? IS NULL) OR (?? IS NULL)) OR (?? != ??)', ['account_id', 'loan_id', 'account_id', 'loan_id']); // Transaction can't be for both account and loan
    table.check('(?? IS NOT NULL) OR (?? != ?)', ['account_id', 'type', 'deposit']); // Deposits must have an account
    table.check('(?? IS NOT NULL) OR (?? != ?)', ['account_id', 'type', 'withdrawal']); // Withdrawals must have an account
    table.check('(?? IS NOT NULL) OR (?? != ?)', ['loan_id', 'type', 'loan_payment']); // Loan payments must have a loan
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  return knex.schema.dropTableIfExists('transactions');
}
