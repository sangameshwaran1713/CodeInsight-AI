require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const analysisRoutes = require('./routes/analysis.routes');
const historyRoutes = require('./routes/history.routes');
const adminRoutes = require('./routes/admin.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to database
connectDB();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - Enhanced helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
    const allowedOrigins = [
      ...envOrigins,
      'http://localhost:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/
    ];
    
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// General rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Import AI service for health checks
const aiService = require('./services/ai.service');
const { protect } = require('./middleware/auth.middleware');

// Health check endpoint - checks Node.js server (protected in production)
const healthProtection = process.env.NODE_ENV === 'production' ? protect : (req, res, next) => next();

app.get('/health', healthProtection, (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Node.js API Gateway',
    timestamp: new Date().toISOString() 
  });
});

// AI Service health check endpoint - checks Python service connectivity (protected)
app.get('/health/ai', healthProtection, async (req, res) => {
  const aiHealth = await aiService.healthCheck();
  const status = aiHealth.status === 'healthy' ? 200 : 503;
  
  res.status(status).json({
    nodeService: 'OK',
    aiService: aiHealth,
    timestamp: new Date().toISOString(),
  });
});

// Full system health check (protected)
app.get('/health/full', healthProtection, async (req, res) => {
  const aiHealth = await aiService.healthCheck();
  
  res.status(200).json({
    status: aiHealth.status === 'healthy' ? 'all_healthy' : 'degraded',
    services: {
      node: { status: 'healthy', port: process.env.PORT || 5000 },
      ai: aiHealth,
    },
    timestamp: new Date().toISOString(),
  });
});

// Unified analyze endpoint
const { analyze, analyzeWithFile } = require('./controllers/analysis.controller');
const { analysisValidation } = require('./middleware/validation.middleware');
const upload = require('./middleware/upload.middleware');

// POST /api/analyze - accepts JSON body or multipart form with file
app.post('/api/analyze', protect, upload.single('file'), analyze);

// POST /api/analyze/upload - dedicated file upload endpoint
app.post('/api/analyze/upload', protect, upload.single('file'), analyzeWithFile);

// API routes - Apply auth rate limiter to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
