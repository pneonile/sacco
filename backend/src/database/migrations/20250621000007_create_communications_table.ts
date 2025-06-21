/**
 * Migration: Create Communications Table
 * 
 * This migration creates the communications table for managing all types of member
 * communications including SMS, email, push notifications, and WhatsApp messages.
 * It includes message templating, scheduling, delivery tracking, and reporting.
 */
import { Knex } from 'knex';

// Communication types enum
const COMMUNICATION_TYPES = ['sms', 'email', 'push', 'whatsapp'];

// Communication status enum
const COMMUNICATION_STATUSES = ['draft', 'scheduled', 'sent', 'failed'];

// Communication priority enum
const COMMUNICATION_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('communications', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic communication details
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.enum('type', COMMUNICATION_TYPES).notNullable();
    table.jsonb('recipients').notNullable().comment('Array of recipient IDs or contact information');
    table.timestamp('scheduled_date').nullable();
    table.timestamp('sent_date').nullable();
    table.enum('status', COMMUNICATION_STATUSES).notNullable().defaultTo('draft');
    
    // Message template and variables
    table.string('template_id').nullable().comment('ID of predefined template, especially for WhatsApp');
    table.jsonb('message_variables').nullable().comment('Variables to populate in template');
    table.text('subject').nullable().comment('Subject line for emails');
    table.enum('priority', COMMUNICATION_PRIORITIES).defaultTo('medium');
    
    // Delivery tracking
    table.jsonb('delivery_reports').defaultTo('[]').comment('Array of delivery statuses per recipient');
    table.text('failure_reason').nullable();
    table.integer('retry_count').defaultTo(0);
    table.integer('max_retries').defaultTo(3);
    table.integer('delivered_count').defaultTo(0).comment('Number of successfully delivered messages');
    table.integer('failed_count').defaultTo(0).comment('Number of failed deliveries');
    table.integer('pending_count').defaultTo(0).comment('Number of pending deliveries');
    table.decimal('delivery_success_rate', 5, 2).nullable();
    
    // WhatsApp specific fields
    table.boolean('is_whatsapp_template').defaultTo(false);
    table.string('whatsapp_template_namespace').nullable();
    table.string('whatsapp_template_name').nullable();
    table.string('whatsapp_template_language').nullable().defaultTo('en_US');
    table.jsonb('whatsapp_components').nullable().comment('Components data for WhatsApp templates');
    table.jsonb('whatsapp_buttons').nullable().comment('Interactive buttons for WhatsApp messages');
    table.string('whatsapp_callback_data').nullable();
    
    // Categorization and filtering
    table.string('category').nullable().comment('General category like "announcement", "reminder", etc.');
    table.string('campaign_id').nullable().comment('ID for grouping related communications');
    table.jsonb('tags').defaultTo('[]').comment('Tags for filtering and categorization');
    
    // Attachments
    table.jsonb('attachments').defaultTo('[]').comment('File attachments for emails');
    table.boolean('has_attachments').defaultTo(false);
    
    // Analytics and tracking
    table.integer('open_count').defaultTo(0).comment('Number of times email was opened');
    table.integer('click_count').defaultTo(0).comment('Number of link clicks');
    table.timestamp('last_interaction_date').nullable();
    table.jsonb('tracking_data').nullable();
    
    // Audit fields
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('sent_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    // Indexes for performance
    table.index('title');
    table.index('type');
    table.index('status');
    table.index('scheduled_date');
    table.index('sent_date');
    table.index('template_id');
    table.index('category');
    table.index('campaign_id');
    table.index('deleted_at'); // For soft delete queries
    
    // Composite indexes for common queries
    table.index(['type', 'status']);
    table.index(['status', 'scheduled_date']);
    table.index(['type', 'sent_date']);
    
    // WhatsApp specific indexes
    table.index(['is_whatsapp_template', 'whatsapp_template_name']);
  });
  
  // Create delivery reports table for detailed tracking
  return knex.schema.createTable('communication_delivery_reports', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key to communications
    table.uuid('communication_id').notNullable()
      .references('id').inTable('communications')
      .onDelete('CASCADE');
    
    // Recipient details
    table.uuid('recipient_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('recipient_contact').notNullable().comment('Phone number or email address');
    
    // Delivery status
    table.enum('status', ['delivered', 'failed', 'pending']).notNullable().defaultTo('pending');
    table.timestamp('delivered_at').nullable();
    table.text('failure_reason').nullable();
    table.integer('retry_count').defaultTo(0);
    table.string('external_reference').nullable().comment('Reference ID from provider');
    table.jsonb('provider_response').nullable();
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('communication_id');
    table.index('recipient_id');
    table.index('recipient_contact');
    table.index('status');
    table.index('delivered_at');
    table.index('external_reference');
    
    // Composite indexes
    table.index(['communication_id', 'status']);
    table.index(['recipient_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('communication_delivery_reports');
  return knex.schema.dropTableIfExists('communications');
}
