import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid input data', details: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if ((err as any).code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if ((err as any).code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  res.status(500).json({ error: 'Internal server error' });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
};
