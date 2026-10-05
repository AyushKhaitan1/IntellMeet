import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// HTTP request logging stream
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

// Body parsers
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));
app.use(cookieParser());
app.use(compression());

// Static files for uploaded media
app.use('/uploads', express.static(path.resolve('uploads')));

// General API rate limiter
app.use('/api', apiLimiter);

// API Routes (Mounted on both /api and /api/v1 for complete frontend compatibility)
app.use('/api/v1', routes);
app.use('/api', routes);

// Base welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IntellMeet API - AI-Powered Enterprise Meeting & Collaboration Platform',
    version: '2.0.0-Industry-Edition',
    docs: '/api/v1/health',
    status: 'online'
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
