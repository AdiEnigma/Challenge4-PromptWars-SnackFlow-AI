export interface PollingConfig {
  interval: number; // ms
  minInterval: number;
  maxInterval: number;
  enabled: boolean;
}

export interface PollingState {
  lastPoll: string | null;
  nextPoll: string | null;
  isActive: boolean;
  failureCount: number;
  currentInterval: number;
}
