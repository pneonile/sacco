import { ModelObject } from 'objection';
import Investment, { InvestmentType, InvestmentStatus, InterestPaymentSchedule } from '../models/Investment';
import { UserServiceError } from './UserService'; // Reusing custom error class

// Custom error class for investment-related errors
export class InvestmentServiceError extends UserServiceError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
    this.name = 'InvestmentServiceError';
  }
}

// Investment filter options interface
export interface InvestmentFilterOptions {
  type?: InvestmentType;
  status?: InvestmentStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  maturingSoon?: boolean;
}

export class InvestmentService {
  /**
   * Create a new investment record.
   * @param investmentData Data for the new investment.
   * @param createdBy ID of the user creating the investment.
   * @returns The created investment object.
   */
  async createInvestment(investmentData: Partial<Investment>, createdBy?: string): Promise<Investment> {
    try {
      const newInvestment = await Investment.query().insert({
        ...investmentData,
        createdBy,
        updatedBy: createdBy,
        status: investmentData.status || InvestmentStatus.ACTIVE,
        purchaseDate: investmentData.purchaseDate || new Date().toISOString().split('T')[0],
        currentValue: investmentData.currentValue || investmentData.amount, // Default current value to amount if not provided
      });
      return newInvestment;
    } catch (error) {
      throw new InvestmentServiceError(`Failed to create investment: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get an investment by its ID.
   * @param id The ID of the investment.
   * @returns The investment object.
   */
  async getInvestmentById(id: string): Promise<Investment> {
    try {
      const investment = await Investment.query().findById(id);
      if (!investment) {
        throw new InvestmentServiceError('Investment not found', 404);
      }
      return investment;
    } catch (error) {
      if (error instanceof InvestmentServiceError) {
        throw error;
      }
      throw new InvestmentServiceError(`Failed to get investment: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update an existing investment record.
   * @param id The ID of the investment to update.
   * @param updateData Data to update the investment with.
   * @param updatedBy ID of the user updating the investment.
   * @returns The updated investment object.
   */
  async updateInvestment(id: string, updateData: Partial<Investment>, updatedBy?: string): Promise<Investment> {
    try {
      const existingInvestment = await Investment.query().findById(id);
      if (!existingInvestment) {
        throw new InvestmentServiceError('Investment not found', 404);
      }

      const updatedInvestment = await Investment.query().patchAndFetchById(id, {
        ...updateData,
        updatedBy,
        updatedAt: new Date(),
      });
      return updatedInvestment;
    } catch (error) {
      if (error instanceof InvestmentServiceError) {
        throw error;
      }
      throw new InvestmentServiceError(`Failed to update investment: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete an investment record (soft delete).
   * @param id The ID of the investment to delete.
   * @param deletedBy ID of the user performing the deletion.
   */
  async deleteInvestment(id: string, deletedBy?: string): Promise<void> {
    try {
      const existingInvestment = await Investment.query().findById(id);
      if (!existingInvestment) {
        throw new InvestmentServiceError('Investment not found', 404);
      }

      await Investment.query().patchAndFetchById(id, {
        updatedBy: deletedBy,
        deletedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof InvestmentServiceError) {
        throw error;
      }
      throw new InvestmentServiceError(`Failed to delete investment: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a list of investments with filtering, sorting, and pagination.
   * @param options Filter, sort, and pagination options.
   * @returns A paginated list of investments.
   */
  async getInvestments(options: InvestmentFilterOptions = {}): Promise<{ investments: Investment[]; total: number }> {
    try {
      const {
        type,
        status,
        search,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        page = 1,
        limit = 10,
        maturingSoon = false,
      } = options;

      const offset = (page - 1) * limit;

      let query = Investment.query().whereNull('deletedAt');

      if (type) {
        query = query.where('type', type);
      }

      if (status) {
        query = query.where('status', status);
      }

      if (search) {
        query = query.where(builder => {
          builder
            .where('name', 'ilike', `%${search}%`)
            .orWhere('institutionName', 'ilike', `%${search}%`)
            .orWhere('investmentNumber', 'ilike', `%${search}%`);
        });
      }

      if (maturingSoon) {
        query = query.modify('maturingSoon');
      }

      query = query.orderBy(sortBy, sortDirection);

      const total = await query.clone().resultSize();
      const investments = await query.limit(limit).offset(offset);

      return { investments, total };
    } catch (error) {
      throw new InvestmentServiceError(`Failed to retrieve investments: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get total investment value and current value.
   * @returns Object with total invested and current value.
   */
  async getTotalInvestmentValue(): Promise<{ totalInvested: number; currentValue: number; }> {
    try {
      const result = await Investment.getTotalInvestmentValue();
      return result;
    } catch (error) {
      throw new InvestmentServiceError(`Failed to get total investment value: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get investments categorized by type.
   * @returns Object with investment counts and values by category.
   */
  async getInvestmentsByCategory(): Promise<Record<string, { count: number; amount: number; currentValue: number; }>> {
    try {
      const result = await Investment.getInvestmentsByCategory();
      return result;
    } catch (error) {
      throw new InvestmentServiceError(`Failed to get investments by category: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Process investments that have reached their maturity date.
   * @returns Number of investments processed.
   */
  async processMaturity(): Promise<number> {
    try {
      const processedCount = await Investment.processMaturity();
      return processedCount;
    } catch (error) {
      throw new InvestmentServiceError(`Failed to process matured investments: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Record interest earned for an investment.
   * @param id The ID of the investment.
   * @param amount The amount of interest earned.
   * @returns The updated investment object.
   */
  async recordInterestEarned(id: string, amount: number): Promise<Investment> {
    try {
      const investment = await this.getInvestmentById(id);
      const updatedInvestment = await investment.recordInterestEarned(amount);
      return updatedInvestment;
    } catch (error) {
      if (error instanceof InvestmentServiceError) {
        throw error;
      }
      throw new InvestmentServiceError(`Failed to record interest earned: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Record interest paid for an investment.
   * @param id The ID of the investment.
   * @param amount The amount of interest paid.
   * @returns The updated investment object.
   */
  async recordInterestPaid(id: string, amount: number): Promise<Investment> {
    try {
      const investment = await this.getInvestmentById(id);
      const updatedInvestment = await investment.recordInterestPaid(amount);
      return updatedInvestment;
    } catch (error) {
      if (error instanceof InvestmentServiceError) {
        throw error;
      }
      throw new InvestmentServiceError(`Failed to record interest paid: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Sell an investment.
   * @param id The ID of the investment.
   * @param saleValue The value at which the investment was sold.
   * @param saleDate The date of the sale.
   * @returns The updated investment object.
   */
  async sellInvestment(id: string, saleValue: number, saleDate?: string): Promise<Investment> {
    try {
      const investment = await this.getInvestmentById(id);
      const updatedInvestment = await investment.sell(saleValue, saleDate);
      return updatedInvestment;
    } catch (error) {
      if (error instanceof InvestmentServiceError) {
        throw error;
      }
      throw new InvestmentServiceError(`Failed to sell investment: ${(error as Error).message}`, 500);
    }
  }
}

export default new InvestmentService();
