import { io, Socket } from 'socket.io-client';
import { WSMessage, WSEventType } from '@snackflow/shared-types';

type EventHandler = (data: unknown) => void;

class WebSocketManager {
  private socket: Socket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private url: string;

  constructor() {
    this.url = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';
  }

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.baseReconnectDelay,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.onAny((event: string, data: unknown) => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
      const wildcardHandlers = this.handlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) =>
          handler({ event, data, timestamp: new Date().toISOString() } as WSMessage)
        );
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribe(event: WSEventType | '*', handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  subscribeToRoom(room: string): void {
    this.emit('JOIN_ROOM', { room });
  }

  leaveRoom(room: string): void {
    this.emit('LEAVE_ROOM', { room });
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
