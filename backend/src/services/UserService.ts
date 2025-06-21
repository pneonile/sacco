/**
 * User Service
 * 
 * This service handles all user-related operations including authentication,
 * user management, password resets, and search functionality. It replaces
 * the mock data implementation with real database operations using the User model.
 */
import { Transaction } from 'objection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User, { UserRole, UserStatus } from '../models/User';

// Custom error class for user-related errors
export class UserServiceError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'UserServiceError';
    this.statusCode = statusCode;
  }
}

// Authentication response interface
export interface AuthResponse {
  user: any;
  token: string;
  refreshToken: string;
}

// User filter options interface
export interface UserFilterOptions {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Password reset token interface
interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}

export class UserService {
  // Environment variables (would be loaded from .env in production)
  private JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_local_testing';
  private JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
  private JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key';
  private JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
  
  // In-memory store for refresh tokens (would be in database in production)
  private refreshTokens: RefreshToken[] = [];
  
  /**
   * Authenticate a user with email and password
   * @param email User email
   * @param password User password
   * @returns Authentication response with user data and tokens
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new UserServiceError('Invalid email or password.', 401);
      }
      
      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new UserServiceError('Your account is not active. Please contact the administrator.', 403);
      }
      
      // Check if account is locked due to too many failed attempts
      if (user.isLocked()) {
        throw new UserServiceError('Your account is temporarily locked due to too many failed login attempts. Please try again later.', 403);
      }
      
      // Verify password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        // Record failed login attempt
        await user.recordLoginAttempt(false);
        throw new UserServiceError('Invalid email or password.', 401);
      }
      
      // Record successful login attempt
      await user.recordLoginAttempt(true);
      
      // Generate tokens
      const { token, refreshToken } = this.generateTokens(user.id);
      
      // Return sanitized user data and tokens
      return {
        user: this.sanitizeUser(user),
        token,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Login failed: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Logout a user by revoking all refresh tokens
   * @param userId User ID
   */
  async logout(userId: string): Promise<void> {
    try {
      // Revoke all refresh tokens for this user
      this.refreshTokens.forEach(token => {
        if (token.userId === userId) {
          token.isRevoked = true;
        }
      });
      
      // In a production environment, we would update the database
      // to revoke all refresh tokens for this user
      
      return Promise.resolve();
    } catch (error) {
      throw new UserServiceError(`Logout failed: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Get user by ID
   * @param id User ID
   * @returns User object
   */
  async getUserById(id: string): Promise<User> {
    try {
      const user = await User.query().findById(id);
      if (!user) {
        throw new UserServiceError('User not found', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to get user: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Create a new user
   * @param userData User data
   * @param createdBy ID of the user creating this user
   * @returns Created user
   */
  async createUser(userData: Partial<User>, createdBy?: string): Promise<User> {
    try {
      // Check if email already exists
      const existingEmail = await User.findByEmail(userData.email!);
      if (existingEmail) {
        throw new UserServiceError('Email already in use', 400);
      }
      
      // Check if member number already exists (if provided)
      if (userData.memberNumber) {
        const existingMemberNumber = await User.findByMemberNumber(userData.memberNumber);
        if (existingMemberNumber) {
          throw new UserServiceError('Member number already in use', 400);
        }
      }
      
      // Check if ID number already exists
      if (userData.idNumber) {
        const existingIdNumber = await User.findByIdNumber(userData.idNumber);
        if (existingIdNumber) {
          throw new UserServiceError('ID number already in use', 400);
        }
      }
      
      // Create user with audit trail
      const user = await User.query().insert({
        ...userData,
        createdBy,
        updatedBy: createdBy,
        // Set default values if not provided
        status: userData.status || UserStatus.ACTIVE,
        joinDate: userData.joinDate || new Date().toISOString().split('T')[0],
      });
      
      return user;
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to create user: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @param updatedBy ID of the user performing the update
   * @returns Updated user
   */
  async updateUser(id: string, userData: Partial<User>, updatedBy?: string): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await User.query().findById(id);
      if (!existingUser) {
        throw new UserServiceError('User not found', 404);
      }
      
      // Check if email is being changed and if it's already in use
      if (userData.email && userData.email !== existingUser.email) {
        const existingEmail = await User.findByEmail(userData.email);
        if (existingEmail && existingEmail.id !== id) {
          throw new UserServiceError('Email already in use', 400);
        }
      }
      
      // Check if member number is being changed and if it's already in use
      if (userData.memberNumber && userData.memberNumber !== existingUser.memberNumber) {
        const existingMemberNumber = await User.findByMemberNumber(userData.memberNumber);
        if (existingMemberNumber && existingMemberNumber.id !== id) {
          throw new UserServiceError('Member number already in use', 400);
        }
      }
      
      // Check if ID number is being changed and if it's already in use
      if (userData.idNumber && userData.idNumber !== existingUser.idNumber) {
        const existingIdNumber = await User.findByIdNumber(userData.idNumber);
        if (existingIdNumber && existingIdNumber.id !== id) {
          throw new UserServiceError('ID number already in use', 400);
        }
      }
      
      // Update user with audit trail
      const updatedUser = await User.query().patchAndFetchById(id, {
        ...userData,
        updatedBy,
        updatedAt: new Date(),
      });
      
      return updatedUser;
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to update user: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Delete a user (soft delete)
   * @param id User ID
   * @param deletedBy ID of the user performing the deletion
   */
  async deleteUser(id: string, deletedBy?: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await User.query().findById(id);
      if (!existingUser) {
        throw new UserServiceError('User not found', 404);
      }
      
      // Soft delete the user
      await User.query().patchAndFetchById(id, {
        updatedBy: deletedBy,
        deletedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to delete user: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Change user password
   * @param id User ID
   * @param currentPassword Current password
   * @param newPassword New password
   * @param updatedBy ID of the user performing the update
   */
  async changePassword(id: string, currentPassword: string, newPassword: string, updatedBy?: string): Promise<void> {
    try {
      // Check if user exists
      const user = await User.query().findById(id);
      if (!user) {
        throw new UserServiceError('User not found', 404);
      }
      
      // Verify current password
      const isPasswordValid = await user.validatePassword(currentPassword);
      if (!isPasswordValid) {
        throw new UserServiceError('Current password is incorrect', 401);
      }
      
      // Update password
      await User.query().patchAndFetchById(id, {
        password: newPassword, // Will be hashed by the model's $beforeUpdate hook
        updatedBy,
        updatedAt: new Date(),
      });
      
      // Revoke all refresh tokens for this user
      this.refreshTokens.forEach(token => {
        if (token.userId === id) {
          token.isRevoked = true;
        }
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to change password: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Request password reset
   * @param email User email
   * @returns Reset token
   */
  async requestPasswordReset(email: string): Promise<string | null> {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        // For security reasons, don't reveal that the email doesn't exist
        return null;
      }
      
      // Generate reset token
      const resetToken = await user.generatePasswordResetToken();
      
      return resetToken;
    } catch (error) {
      throw new UserServiceError(`Failed to request password reset: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Reset password with token
   * @param token Reset token
   * @param newPassword New password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find user by reset token
      const user = await User.findByPasswordResetToken(token);
      if (!user) {
        throw new UserServiceError('Invalid or expired reset token', 400);
      }
      
      // Update password and clear reset token
      await User.query().patchAndFetchById(user.id, {
        password: newPassword, // Will be hashed by the model's $beforeUpdate hook
        updatedAt: new Date(),
      });
      
      // Clear reset token
      await user.clearPasswordResetToken();
      
      // Revoke all refresh tokens for this user
      this.refreshTokens.forEach(token => {
        if (token.userId === user.id) {
          token.isRevoked = true;
        }
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to reset password: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Update user status
   * @param id User ID
   * @param status New status
   * @param updatedBy ID of the user performing the update
   * @returns Updated user
   */
  async updateUserStatus(id: string, status: UserStatus, updatedBy?: string): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await User.query().findById(id);
      if (!existingUser) {
        throw new UserServiceError('User not found', 404);
      }
      
      // Update status
      const updatedUser = await User.query().patchAndFetchById(id, {
        status,
        updatedBy,
        updatedAt: new Date(),
      });
      
      return updatedUser;
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to update user status: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Search users with filters
   * @param options Filter options
   * @returns Filtered users and total count
   */
  async getUsers(options: UserFilterOptions = {}): Promise<{ users: User[]; total: number }> {
    try {
      const {
        role,
        status,
        search,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        page = 1,
        limit = 10,
      } = options;
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Build query
      let query = User.query().whereNull('deletedAt');
      
      // Apply filters
      if (role) {
        query = query.where('role', role);
      }
      
      if (status) {
        query = query.where('status', status);
      }
      
      // Apply search
      if (search) {
        query = query.where(builder => {
          builder
            .where('firstName', 'ilike', `%${search}%`)
            .orWhere('lastName', 'ilike', `%${search}%`)
            .orWhere('email', 'ilike', `%${search}%`)
            .orWhere('phoneNumber', 'ilike', `%${search}%`)
            .orWhere('memberNumber', 'ilike', `%${search}%`)
            .orWhere('idNumber', 'ilike', `%${search}%`);
        });
      }
      
      // Apply sorting
      query = query.orderBy(sortBy, sortDirection);
      
      // Get total count
      const total = await query.clone().resultSize();
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      // Execute query
      const users = await query;
      
      return { users, total };
    } catch (error) {
      throw new UserServiceError(`Failed to get users: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Refresh authentication token
   * @param refreshToken Refresh token
   * @returns New authentication token and refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Find refresh token
      const storedToken = this.refreshTokens.find(
        token => token.token === refreshToken && !token.isRevoked
      );
      
      if (!storedToken) {
        throw new UserServiceError('Invalid refresh token', 401);
      }
      
      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        throw new UserServiceError('Refresh token expired', 401);
      }
      
      // Find user
      const user = await this.getUserById(storedToken.userId);
      
      // Revoke current refresh token
      storedToken.isRevoked = true;
      
      // Generate new tokens
      const newTokens = this.generateTokens(user.id);
      
      return newTokens;
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error;
      }
      throw new UserServiceError(`Failed to refresh token: ${(error as Error).message}`, 500);
    }
  }
  
  /**
   * Verify JWT token
   * @param token JWT token
   * @returns User ID from token payload
   */
  verifyToken(token: string): string {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new UserServiceError('Invalid token', 401);
    }
  }
  
  /**
   * Generate authentication and refresh tokens
   * @param userId User ID
   * @returns Authentication token and refresh token
   */
  private generateTokens(userId: string): { token: string; refreshToken: string } {
    // Generate access token
    const token = jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRY });
    
    // Generate refresh token
    const refreshToken = uuidv4();
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    this.refreshTokens.push({
      id: uuidv4(),
      userId,
      token: refreshToken,
      expiresAt,
      isRevoked: false
    });
    
    return { token, refreshToken };
  }
  
  /**
   * Sanitize user object by removing sensitive fields
   * @param user User object
   * @returns Sanitized user object
   */
  private sanitizeUser(user: User): Omit<User, 'password' | 'passwordResetToken' | 'passwordResetExpires' | 'twoFactorSecret'> {
    const {
      password,
      passwordResetToken,
      passwordResetExpires,
      twoFactorSecret,
      ...sanitizedUser
    } = user;
    
    return sanitizedUser;
  }
}

export default new UserService();
