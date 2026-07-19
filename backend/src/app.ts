import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { config } from './config';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

import authRoutes from './routes/authRoutes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: config.frontendUrls,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

export function mountDynamicRoutes(fanRoutes: any, vendorRoutes: any, managerRoutes: any) {
  app.use('/api', fanRoutes);
  app.use('/api/vendor', vendorRoutes);
  app.use('/api/manager', managerRoutes);
  logger.info('Dynamic API routes mounted');
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
