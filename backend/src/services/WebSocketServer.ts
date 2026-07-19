import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';
import { JwtPayload, UserRole } from '../types';
import { logger } from '../config/logger';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    preferredLanguage: string;
  };
}

export class WebSocketServer {
  public io: Server;

  constructor(httpServer: http.Server) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.frontendUrls,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        const user = await User.findById(decoded.userId);
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          preferredLanguage: user.language,
        };
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', {
        userId: socket.user?.id,
        role: socket.user?.role,
        socketId: socket.id,
      });

      socket.on('SUBSCRIBE_HEATMAP', () => {
        socket.join('heatmap_updates');
        logger.debug('Client subscribed to heatmap', { socketId: socket.id });
      });

      socket.on('SUBSCRIBE_STALL', (stallId: string) => {
        if (socket.user?.role === 'vendor') {
          socket.join(`stall_${stallId}`);
          logger.debug('Vendor subscribed to stall', { socketId: socket.id, stallId });
        }
      });

      socket.on('SUBSCRIBE_STADIUM', () => {
        if (socket.user?.role === 'manager') {
          socket.join('stadium_updates');
          logger.debug('Manager subscribed to stadium', { socketId: socket.id });
        }
      });

      socket.on('SUBSCRIBE_ALERTS', (stallId?: string) => {
        if (stallId) {
          socket.join(`alerts_${stallId}`);
        } else {
          socket.join('alerts_all');
        }
      });

      socket.on('unsubscribe', (room: string) => {
        socket.leave(room);
      });

      socket.on('disconnect', (reason) => {
        logger.info('WebSocket client disconnected', {
          userId: socket.user?.id,
          reason,
          socketId: socket.id,
        });
      });
    });
  }

  public broadcastHeatmap(data: any) {
    this.io.to('heatmap_updates').emit('HEATMAP_UPDATE', {
      event: 'HEATMAP_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastStallUpdate(stallId: string, data: any) {
    this.io.to(`stall_${stallId}`).emit('FORECAST_UPDATE', {
      event: 'FORECAST_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastStadiumUpdate(data: any) {
    this.io.to('stadium_updates').emit('STADIUM_METRICS', {
      event: 'STADIUM_METRICS',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastAlert(stallId: string, data: any) {
    this.io.to(`alerts_${stallId}`).emit('ALERT_UPDATE', {
      event: 'ALERT_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
    this.io.to('alerts_all').emit('ALERT_UPDATE', {
      event: 'ALERT_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastAnnouncement(data: any) {
    this.io.emit('ANNOUNCEMENT', {
      event: 'ANNOUNCEMENT',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastInventoryUpdate(stallId: string, data: any) {
    this.io.to(`stall_${stallId}`).emit('INVENTORY_UPDATE', {
      event: 'INVENTORY_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastQueueUpdate(stallId: string, data: any) {
    this.io.to(`stall_${stallId}`).emit('QUEUE_UPDATE', {
      event: 'QUEUE_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
    this.io.to('heatmap_updates').emit('QUEUE_UPDATE', {
      event: 'QUEUE_UPDATE',
      data: { ...data, stallId },
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastRestockingUpdate(data: any) {
    this.io.to('stadium_updates').emit('RESTOCKING_UPDATE', {
      event: 'RESTOCKING_UPDATE',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public getConnectedCount(): number {
    return this.io.engine.clientsCount;
  }
}
