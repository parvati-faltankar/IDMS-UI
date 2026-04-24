import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { registerRoutes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_request, response) => {
    response.json({
      success: true,
      message: 'Procurement backend is healthy',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  registerRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
