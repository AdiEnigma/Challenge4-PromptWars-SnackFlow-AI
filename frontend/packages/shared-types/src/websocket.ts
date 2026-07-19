export type WSEventType =
  | 'HEATMAP_UPDATE'
  | 'OVERFLOW_EVENT'
  | 'ANNOUNCEMENT'
  | 'ALERT_UPDATE'
  | 'INVENTORY_UPDATE'
  | 'FORECAST_UPDATE'
  | 'RESTOCKING_UPDATE'
  | 'QUEUE_UPDATE'
  | 'STADIUM_METRICS';

export interface WSMessage<T = unknown> {
  event: WSEventType;
  data: T;
  timestamp: string;
}

export interface WSConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastConnected: string | null;
  error: string | null;
}
