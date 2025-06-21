/**
 * User Model
 * 
 * This model represents users in the system, including members, staff, and admins.
 * It handles authentication, authorization, and relationships to other entities.
 */
import { Model, ModelObject, RelationMappings } from 'objection';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { BaseModel } from '../config/database';

// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  MEMBER = 'member',
}

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class User extends BaseModel {
  // Table name
  static tableName = 'users';

  // Define properties with TypeScript types
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
  memberNumber?: string;
  phoneNumber!: string;
  idNumber!: string;
  address!: string;
  employerName?: string;
  joinDate!: string;
  status!: UserStatus;
  profileImage?: string;

  // Authentication fields
  password!: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;

  // Verification and security
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;

  // Audit fields
  createdBy?: string;
  updatedBy?: string;

  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  // Virtual properties (not stored in database)
  fullName?: string;

  // JSON Schema for validation
  static jsonSchema = {
    type: 'object',
    required: ['email', 'firstName', 'lastName', 'role', 'phoneNumber', 'idNumber', 'address', 'joinDate', 'password'],

    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email', minLength: 5, maxLength: 255 },
      firstName: { type: 'string', minLength: 1, maxLength: 100 },
      lastName: { type: 'string', minLength: 1, maxLength: 100 },
      role: { type: 'string', enum: Object.values(UserRole) },
      memberNumber: { type: ['string', 'null'], maxLength: 50 },
      phoneNumber: { type: 'string', minLength: 10, maxLength: 20 },
      idNumber: { type: 'string', minLength: 5, maxLength: 50 },
      address: { type: 'string', minLength: 5, maxLength: 500 },
      employerName: { type: ['string', 'null'], maxLength: 200 },
      joinDate: { type: 'string', format: 'date' },
      status: { type: 'string', enum: Object.values(UserStatus) },
      profileImage: { type: ['string', 'null'] },
      
      // Authentication fields
      password: { type: 'string', minLength: 8 },
      passwordResetToken: { type: ['string', 'null'] },
      passwordResetExpires: { type: ['string', 'null'], format: 'date-time' },
      lastLoginAt: { type: ['string', 'null'], format: 'date-time' },
      failedLoginAttempts: { type: 'integer', minimum: 0 },
      lockedUntil: { type: ['string', 'null'], format: 'date-time' },
      
      // Verification and security
      emailVerified: { type: 'boolean', default: false },
      phoneVerified: { type: 'boolean', default: false },
      twoFactorEnabled: { type: 'boolean', default: false },
      twoFactorSecret: { type: ['string', 'null'] },
      
      // Audit fields
      createdBy: { type: ['string', 'null'], format: 'uuid' },
      updatedBy: { type: ['string', 'null'], format: 'uuid' },
      
      // Timestamps
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    }
  };

  // Modifiers for common query patterns
  static modifiers = {
    // Active users only
    active(query) {
      query.where('status', UserRole.ACTIVE);
    },
    
    // Members only
    members(query) {
      query.where('role', UserRole.MEMBER);
    },
    
    // Staff only
    staff(query) {
      query.where('role', UserRole.STAFF);
    },
    
    // Admins only
    admins(query) {
      query.where('role', UserRole.ADMIN);
    },
    
    // Default select (excludes sensitive fields)
    defaultSelect(query) {
      query.select(
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'memberNumber',
        'phoneNumber',
        'idNumber',
        'address',
        'employerName',
        'joinDate',
        'status',
        'profileImage',
        'emailVerified',
        'phoneVerified',
        'twoFactorEnabled',
        'createdAt',
        'updatedAt'
      );
    }
  };

  // Relationships
  static get relationMappings(): RelationMappings {
    // Import models here to avoid circular dependencies
    // We'll create these models in subsequent steps
    const Account = require('./Account').default;
    const Loan = require('./Loan').default;
    const Transaction = require('./Transaction').default;
    
    return {
      accounts: {
        relation: Model.HasManyRelation,
        modelClass: Account,
        join: {
          from: 'users.id',
          to: 'accounts.member_id'
        }
      },
      
      loans: {
        relation: Model.HasManyRelation,
        modelClass: Loan,
        join: {
          from: 'users.id',
          to: 'loans.member_id'
        }
      },
      
      transactions: {
        relation: Model.HasManyRelation,
        modelClass: Transaction,
        join: {
          from: 'users.id',
          to: 'transactions.member_id'
        }
      },
      
      createdByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'users.createdBy',
          to: 'users.id'
        }
      },
      
      updatedByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'users.updatedBy',
          to: 'users.id'
        }
      }
    };
  }

  // Virtual getter for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Password hashing and validation methods
  async $beforeInsert(): Promise<void> {
    await super.$beforeInsert();
    
    // Generate UUID if not provided
    if (!this.id) {
      this.id = uuidv4();
    }
    
    // Hash password if it's a new record
    if (this.password) {
      this.password = await this.hashPassword(this.password);
    }
  }

  async $beforeUpdate(): Promise<void> {
    await super.$beforeUpdate();
    
    // Hash password if it's being updated
    if (this.password && !this.password.startsWith('$2a$')) {
      this.password = await this.hashPassword(this.password);
    }
  }

  // Hash a password
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Validate password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Static methods for common queries
  static async findByEmail(email: string): Promise<User | undefined> {
    return this.query()
      .where('email', email.toLowerCase())
      .first();
  }

  static async findByMemberNumber(memberNumber: string): Promise<User | undefined> {
    return this.query()
      .where('memberNumber', memberNumber)
      .first();
  }

  static async findByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return this.query()
      .where('phoneNumber', phoneNumber)
      .first();
  }

  static async findByIdNumber(idNumber: string): Promise<User | undefined> {
    return this.query()
      .where('idNumber', idNumber)
      .first();
  }

  static async findByPasswordResetToken(token: string): Promise<User | undefined> {
    return this.query()
      .where('passwordResetToken', token)
      .where('passwordResetExpires', '>', new Date())
      .first();
  }

  // Search users by name, email, phone, or member number
  static async search(searchTerm: string, limit = 10, offset = 0): Promise<{ results: User[]; total: number }> {
    const query = this.query()
      .where(builder => {
        builder
          .where('firstName', 'ilike', `%${searchTerm}%`)
          .orWhere('lastName', 'ilike', `%${searchTerm}%`)
          .orWhere('email', 'ilike', `%${searchTerm}%`)
          .orWhere('phoneNumber', 'ilike', `%${searchTerm}%`)
          .orWhere('memberNumber', 'ilike', `%${searchTerm}%`)
          .orWhere('idNumber', 'ilike', `%${searchTerm}%`);
      });
    
    const [results, total] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().resultSize()
    ]);
    
    return { results, total };
  }

  // Record login attempt
  async recordLoginAttempt(successful: boolean): Promise<void> {
    if (successful) {
      // Reset failed attempts and update last login time
      await User.query()
        .patch({
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
          lockedUntil: null
        })
        .where('id', this.id);
    } else {
      // Increment failed attempts and potentially lock the account
      const updatedUser = await User.query()
        .patchAndFetchById(this.id, {
          failedLoginAttempts: (this.failedLoginAttempts || 0) + 1
        });
      
      // Lock account after 5 failed attempts
      if (updatedUser.failedLoginAttempts && updatedUser.failedLoginAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes
        
        await User.query()
          .patch({
            lockedUntil: lockUntil
          })
          .where('id', this.id);
      }
    }
  }

  // Check if user account is locked
  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < new Date(this.lockedUntil);
  }

  // Generate password reset token
  async generatePasswordResetToken(): Promise<string> {
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token valid for 1 hour
    
    await User.query()
      .patch({
        passwordResetToken: token,
        passwordResetExpires: expires
      })
      .where('id', this.id);
    
    return token;
  }

  // Clear password reset token
  async clearPasswordResetToken(): Promise<void> {
    await User.query()
      .patch({
        passwordResetToken: null,
        passwordResetExpires: null
      })
      .where('id', this.id);
  }
}

// Type for User model instances
export type UserShape = ModelObject<User>;

export default User;
