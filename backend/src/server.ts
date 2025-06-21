import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import winston from 'winston';
import 'express-async-errors'; // Enables async error handling
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'kawempe-sacco-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      dirname: path.join(__dirname, '../logs'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      dirname: path.join(__dirname, '../logs'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ]
});

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create Express app
const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
}));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression
app.use(compression());

// Request logging
const morganFormat = isProduction ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  skip: (req) => req.path === '/api/v1/health',
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skip: (req) => req.path === '/api/v1/health',
});

// Apply rate limiting to API routes
app.use('/api/v1', apiLimiter);

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// Import API routes
import authRoutes from './routes/auth.routes';
// Future route modules (placeholder until implemented)
// import memberRoutes from './routes/member.routes';
// import loanRoutes from './routes/loan.routes';
// import depositRoutes from './routes/deposit.routes';

// Mount API routes
app.use('/api/v1/auth', authRoutes);

// ------------------------------------------------------------------
// Placeholder routers for upcoming modules.
// They prevent 404s on the frontend while backend routes are pending.
// Replace with real route handlers when implemented.
// ------------------------------------------------------------------
const placeholderRouter = express.Router();
placeholderRouter.use((_req, res) =>
  res.status(501).json({ success: false, message: 'Endpoint not implemented yet' })
);

app.use('/api/v1/members', placeholderRouter);
app.use('/api/v1/loans', placeholderRouter);
app.use('/api/v1/deposits', placeholderRouter);

// For now, add a placeholder route for testing
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Kawempe SACCO API',
    version: '1.0.0',
    documentation: '/api/v1/docs'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id || 'unauthenticated'
  });

  // Don't leak error details in production
  const errorResponse = {
    success: false,
    message: isProduction ? 'An unexpected error occurred' : err.message,
    error: isProduction ? undefined : err.name,
    stack: isProduction ? undefined : err.stack
  };

  res.status(500).json(errorResponse);
});

// Single server instance (assigned in bootstrap)
let server: ReturnType<typeof app.listen> | undefined;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
  process.exit(1);
});

export { }; // nothing to export

/* ------------------------------------------------------------------
 *  Bootstrap the application
 * ----------------------------------------------------------------*/

const bootstrap = async () => {
  try {
    // Initialize database (runs migrations automatically in non-prod)
    await initializeDatabase();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    logger.error('Failed to initialize application', err);
    process.exit(1);
  }
};

bootstrap();

export default app;
