/**
 * LedgerCategory Model
 * 
 * This model represents categories for income and expense entries in the system.
 * It supports hierarchical categorization, budgeting, and active/inactive status.
 */
import { Model, ModelObject, RelationMappings } from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { BaseModel } from '../config/database';
import User from './User'; // Assuming User model exists for createdBy/updatedBy relations

// Enum for ledger entry types (income or expense)
export enum LedgerEntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class LedgerCategory extends BaseModel {
  // Table name
  static tableName = 'ledger_categories';

  // Define properties with TypeScript types
  id!: string;
  name!: string;
  type!: LedgerEntryType;
  code?: string;
  description?: string;
  is_active!: boolean;
  display_order?: number;
  annual_budget?: number;
  monthly_budget?: number;
  parent_id?: string; // For hierarchical categories

  // Audit fields (inherited from BaseModel, but explicitly listed for clarity if needed)
  createdBy?: string;
  updatedBy?: string;

  // Timestamps (inherited from BaseModel)
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  // JSON Schema for validation
  static jsonSchema = {
    type: 'object',
    required: ['name', 'type', 'is_active'],

    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      type: { type: 'string', enum: Object.values(LedgerEntryType) },
      code: { type: ['string', 'null'], maxLength: 50 },
      description: { type: ['string', 'null'] },
      is_active: { type: 'boolean' },
      display_order: { type: ['integer', 'null'], minimum: 0 },
      annual_budget: { type: ['number', 'null'], minimum: 0 },
      monthly_budget: { type: ['number', 'null'], minimum: 0 },
      parent_id: { type: ['string', 'null'], format: 'uuid' },

      createdBy: { type: ['string', 'null'], format: 'uuid' },
      updatedBy: { type: ['string', 'null'], format: 'uuid' },

      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  };

  // Modifiers for common query patterns
  static modifiers = {
    // Active categories only
    active(query: any) {
      query.where('is_active', true);
    },

    // Categories by type (income or expense)
    byType(query: any, type: LedgerEntryType) {
      query.where('type', type);
    },

    // Income categories
    income(query: any) {
      query.where('type', LedgerEntryType.INCOME);
    },

    // Expense categories
    expense(query: any) {
      query.where('type', LedgerEntryType.EXPENSE);
    },

    // Root categories (no parent)
    root(query: any) {
      query.whereNull('parent_id');
    },

    // Default select
    defaultSelect(query: any) {
      query.select(
        'id',
        'name',
        'type',
        'code',
        'description',
        'is_active',
        'display_order',
        'annual_budget',
        'monthly_budget',
        'parent_id',
        'createdAt',
        'updatedAt'
      );
    },
  };

  // Relationships
  static get relationMappings(): RelationMappings {
    return {
      parentCategory: {
        relation: Model.BelongsToOneRelation,
        modelClass: LedgerCategory, // Self-referencing
        join: {
          from: 'ledger_categories.parent_id',
          to: 'ledger_categories.id',
        },
      },
      subCategories: {
        relation: Model.HasManyRelation,
        modelClass: LedgerCategory, // Self-referencing
        join: {
          from: 'ledger_categories.id',
          to: 'ledger_categories.parent_id',
        },
      },
      createdByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'ledger_categories.createdBy',
          to: 'users.id',
        },
      },
      updatedByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'ledger_categories.updatedBy',
          to: 'users.id',
        },
      },
    };
  }

  // Hooks
  async $beforeInsert(): Promise<void> {
    await super.$beforeInsert();
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // Static methods for common queries
  static async findActiveCategories(type?: LedgerEntryType): Promise<LedgerCategory[]> {
    let query = this.query().modify('active').modify('defaultSelect');
    if (type) {
      query = query.where('type', type);
    }
    return query.orderBy('display_order', 'asc').orderBy('name', 'asc');
  }

  static async findIncomeCategories(): Promise<LedgerCategory[]> {
    return this.query().modify('active').modify('income').modify('defaultSelect').orderBy('display_order', 'asc').orderBy('name', 'asc');
  }

  static async findExpenseCategories(): Promise<LedgerCategory[]> {
    return this.query().modify('active').modify('expense').modify('defaultSelect').orderBy('display_order', 'asc').orderBy('name', 'asc');
  }

  static async findRootCategories(type?: LedgerEntryType): Promise<LedgerCategory[]> {
    let query = this.query().modify('active').modify('root').modify('defaultSelect');
    if (type) {
      query = query.where('type', type);
    }
    return query.orderBy('display_order', 'asc').orderBy('name', 'asc');
  }
}

// Type for LedgerCategory model instances
export type LedgerCategoryShape = ModelObject<LedgerCategory>;

export default LedgerCategory;
