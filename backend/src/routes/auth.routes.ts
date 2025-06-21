import express, { Request, Response } from 'express';
import Joi from 'joi';
import userService, { UserServiceError } from '../services/UserService';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'New password is required',
      'any.required': 'New password is required'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
    'any.required': 'Reset token is required'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'New password is required',
      'any.required': 'New password is required'
    })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required'
  })
});

// Middleware to verify JWT token
const verifyToken = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token and get userId
    const userId = userService.verifyToken(token);
    
    // Get user from database
    const user = await userService.getUserById(userId);
    
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * @route   POST /auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { email, password } = value;
    
    // Login user using service
    const authResponse = await userService.login(email, password);
    
    // Return user data and tokens
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: authResponse,
    });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
    });
  }
});

/**
 * @route   POST /auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Logout user using service
    await userService.logout(user.id);
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout.',
    });
  }
});

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user profile.',
    });
  }
});

/**
 * @route   POST /auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { refreshToken } = value;
    
    // Refresh token using service
    const tokens = await userService.refreshToken(refreshToken);
    
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: tokens,
    });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while refreshing token.',
    });
  }
});

/**
 * @route   POST /auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', verifyToken, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { currentPassword, newPassword } = value;
    const user = (req as any).user;
    
    // Change password using service
    await userService.changePassword(user.id, currentPassword, newPassword);
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.',
    });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing password.',
    });
  }
});

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { email } = value;
    
    // Request password reset using service
    const resetToken = await userService.requestPasswordReset(email);
    
    // For security reasons, don't reveal that the email doesn't exist
    return res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link.',
      // For development purposes only, return the token
      ...(process.env.NODE_ENV !== 'production' && resetToken && { resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
    });
  }
});

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    
    const { token, newPassword } = value;
    
    // Reset password using service
    await userService.resetPassword(token, newPassword);
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.',
    });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password.',
    });
  }
});

export default router;
