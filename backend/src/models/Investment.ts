/**
 * Investment Model
 * 
 * This model represents investment records in the system, including fixed deposits,
 * government bonds, treasury bills, real estate, and equity investments.
 * It handles investment tracking, returns calculation, and maturity management.
 */
import { Model, ModelObject, RelationMappings } from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays } from 'date-fns';
import { BaseModel } from '../config/database';
import User from './User';

// Investment types enum
export enum InvestmentType {
  FIXED_DEPOSIT = 'fixed_deposit',
  GOVERNMENT_BONDS = 'government_bonds',
  TREASURY_BILLS = 'treasury_bills',
  REAL_ESTATE = 'real_estate',
  EQUITY = 'equity',
  OTHER = 'other',
}

// Investment status enum
export enum InvestmentStatus {
  ACTIVE = 'active',
  MATURED = 'matured',
  SOLD = 'sold',
}

// Interest payment schedule enum
export enum InterestPaymentSchedule {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual',
  MATURITY = 'maturity',
}

export class Investment extends BaseModel {
  // Table name
  static tableName = 'investments';

  // Define properties with TypeScript types
  id!: string;
  name!: string;
  type!: InvestmentType;
  amount!: number;
  interestRate!: number;
  maturityDate!: string;
  currentValue!: number;
  status!: InvestmentStatus;
  purchaseDate!: string;

  // Additional investment details
  investmentNumber?: string;
  institutionName?: string;
  institutionContact?: string;
  documentReferences?: string[];
  interestPaymentSchedule?: InterestPaymentSchedule;
  lastInterestPaymentDate?: string;
  nextInterestPaymentDate?: string;
  interestEarned?: number;
  interestPaid?: number;
  saleValue?: number;
  saleDate?: string;
  profitLoss?: number;

  // Approval and audit fields
  approvedBy?: string;
  createdBy?: string;
  updatedBy?: string;

  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  // Virtual properties (not stored in database)
  roi?: number;
  daysToMaturity?: number;
  annualizedReturn?: number;

  // JSON Schema for validation
  static jsonSchema = {
    type: 'object',
    required: ['name', 'type', 'amount', 'interestRate', 'maturityDate', 'currentValue', 'status', 'purchaseDate'],

    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      type: { type: 'string', enum: Object.values(InvestmentType) },
      amount: { type: 'number', minimum: 0 },
      interestRate: { type: 'number', minimum: 0 },
      maturityDate: { type: 'string', format: 'date' },
      currentValue: { type: 'number', minimum: 0 },
      status: { type: 'string', enum: Object.values(InvestmentStatus) },
      purchaseDate: { type: 'string', format: 'date' },

      // Additional investment details
      investmentNumber: { type: ['string', 'null'] },
      institutionName: { type: ['string', 'null'] },
      institutionContact: { type: ['string', 'null'] },
      documentReferences: { 
        type: ['array', 'null'],
        items: { type: 'string' }
      },
      interestPaymentSchedule: { 
        type: ['string', 'null'],
        enum: Object.values(InterestPaymentSchedule)
      },
      lastInterestPaymentDate: { type: ['string', 'null'], format: 'date' },
      nextInterestPaymentDate: { type: ['string', 'null'], format: 'date' },
      interestEarned: { type: 'number', minimum: 0, default: 0 },
      interestPaid: { type: 'number', minimum: 0, default: 0 },
      saleValue: { type: ['number', 'null'], minimum: 0 },
      saleDate: { type: ['string', 'null'], format: 'date' },
      profitLoss: { type: ['number', 'null'] },

      // Approval and audit fields
      approvedBy: { type: ['string', 'null'], format: 'uuid' },
      createdBy: { type: ['string', 'null'], format: 'uuid' },
      updatedBy: { type: ['string', 'null'], format: 'uuid' },

      // Timestamps
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };

  // Modifiers for common query patterns
  static modifiers = {
    // Active investments only
    active(query) {
      query.where('status', InvestmentStatus.ACTIVE);
    },

    // Matured investments
    matured(query) {
      query.where('status', InvestmentStatus.MATURED);
    },

    // Sold investments
    sold(query) {
      query.where('status', InvestmentStatus.SOLD);
    },

    // Maturing soon (within 30 days)
    maturingSoon(query) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      query
        .where('status', InvestmentStatus.ACTIVE)
        .where('maturityDate', '<=', thirtyDaysFromNow.toISOString().split('T')[0])
        .where('maturityDate', '>=', new Date().toISOString().split('T')[0]);
    },

    // Default select (excludes sensitive fields)
    defaultSelect(query) {
      query.select(
        'id',
        'name',
        'type',
        'amount',
        'interestRate',
        'maturityDate',
        'currentValue',
        'status',
        'purchaseDate',
        'investmentNumber',
        'institutionName',
        'interestEarned',
        'interestPaid',
        'createdAt',
        'updatedAt'
      );
    }
  };

  // Relationships
  static get relationMappings(): RelationMappings {
    return {
      approvedByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'investments.approvedBy',
          to: 'users.id'
        }
      },
      
      createdByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'investments.createdBy',
          to: 'users.id'
        }
      },
      
      updatedByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'investments.updatedBy',
          to: 'users.id'
        }
      }
    };
  }

  // Hooks
  async $beforeInsert(): Promise<void> {
    await super.$beforeInsert();
    
    // Generate UUID if not provided
    if (!this.id) {
      this.id = uuidv4();
    }
    
    // Set initial values if not provided
    if (this.interestEarned === undefined) {
      this.interestEarned = 0;
    }
    
    if (this.interestPaid === undefined) {
      this.interestPaid = 0;
    }
  }

  async $beforeUpdate(): Promise<void> {
    await super.$beforeUpdate();
    
    // Update profit/loss if investment is sold
    if (this.status === InvestmentStatus.SOLD && this.saleValue !== undefined && this.amount !== undefined) {
      this.profitLoss = this.saleValue - this.amount;
    }
  }

  // Virtual getters
  get roi(): number {
    // Return on Investment calculation
    const totalReturn = (this.currentValue - this.amount) + (this.interestPaid || 0);
    return this.amount > 0 ? (totalReturn / this.amount) * 100 : 0;
  }

  get daysToMaturity(): number | null {
    if (!this.maturityDate || this.status !== InvestmentStatus.ACTIVE) {
      return null;
    }
    
    const today = new Date();
    const maturityDate = new Date(this.maturityDate);
    
    return differenceInDays(maturityDate, today);
  }

  get annualizedReturn(): number {
    // Calculate annualized return based on current value and purchase date
    if (!this.purchaseDate || !this.currentValue || !this.amount) {
      return 0;
    }
    
    const purchaseDate = new Date(this.purchaseDate);
    const today = new Date();
    const daysHeld = differenceInDays(today, purchaseDate);
    
    if (daysHeld <= 0) {
      return 0;
    }
    
    const totalReturn = (this.currentValue - this.amount) + (this.interestPaid || 0);
    const annualFactor = 365 / daysHeld;
    
    return this.amount > 0 ? ((totalReturn / this.amount) * annualFactor * 100) : 0;
  }

  // Static methods for common queries
  static async findActive(): Promise<Investment[]> {
    return this.query().where('status', InvestmentStatus.ACTIVE).orderBy('maturityDate');
  }

  static async findByType(type: InvestmentType): Promise<Investment[]> {
    return this.query().where('type', type);
  }

  static async findMaturingSoon(days: number = 30): Promise<Investment[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return this.query()
      .where('status', InvestmentStatus.ACTIVE)
      .where('maturityDate', '<=', cutoffDate.toISOString().split('T')[0])
      .where('maturityDate', '>=', new Date().toISOString().split('T')[0])
      .orderBy('maturityDate');
  }

  static async getTotalInvestmentValue(): Promise<{ totalInvested: number; currentValue: number; }> {
    const result = await this.query()
      .where('status', InvestmentStatus.ACTIVE)
      .sum('amount as totalInvested')
      .sum('currentValue as currentValue')
      .first();
    
    return {
      totalInvested: Number(result?.totalInvested || 0),
      currentValue: Number(result?.currentValue || 0)
    };
  }

  static async getInvestmentsByCategory(): Promise<Record<string, { count: number; amount: number; currentValue: number; }>> {
    const results = await this.query()
      .select('type')
      .count('id as count')
      .sum('amount as amount')
      .sum('currentValue as currentValue')
      .where('status', InvestmentStatus.ACTIVE)
      .groupBy('type');
    
    const investmentsByCategory: Record<string, { count: number; amount: number; currentValue: number; }> = {};
    
    results.forEach(result => {
      investmentsByCategory[result.type] = {
        count: Number(result.count),
        amount: Number(result.amount),
        currentValue: Number(result.currentValue)
      };
    });
    
    return investmentsByCategory;
  }

  // Process maturity for investments that have reached maturity date
  static async processMaturity(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const maturedInvestments = await this.query()
      .where('status', InvestmentStatus.ACTIVE)
      .where('maturityDate', '<=', today)
      .patch({
        status: InvestmentStatus.MATURED,
        updatedAt: new Date()
      });
    
    return maturedInvestments;
  }

  // Record interest earned
  async recordInterestEarned(amount: number): Promise<Investment> {
    const updatedInvestment = await Investment.query()
      .patchAndFetchById(this.id, {
        interestEarned: (this.interestEarned || 0) + amount,
        lastInterestPaymentDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date()
      });
    
    return updatedInvestment;
  }

  // Record interest paid
  async recordInterestPaid(amount: number): Promise<Investment> {
    const updatedInvestment = await Investment.query()
      .patchAndFetchById(this.id, {
        interestPaid: (this.interestPaid || 0) + amount,
        updatedAt: new Date()
      });
    
    return updatedInvestment;
  }

  // Sell investment
  async sell(saleValue: number, saleDate: string = new Date().toISOString().split('T')[0]): Promise<Investment> {
    const profitLoss = saleValue - this.amount;
    
    const updatedInvestment = await Investment.query()
      .patchAndFetchById(this.id, {
        status: InvestmentStatus.SOLD,
        saleValue,
        saleDate,
        profitLoss,
        updatedAt: new Date()
      });
    
    return updatedInvestment;
  }
}

// Type for Investment model instances
export type InvestmentShape = ModelObject<Investment>;

export default Investment;
