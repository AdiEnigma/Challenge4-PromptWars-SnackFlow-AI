import { MatchContext } from './types';

export interface MatchContextServiceConfig {
  pollIntervalSeconds: number;
}

export class MatchContextService {
  private currentContext: MatchContext | null = null;
  private listeners: Array<(context: MatchContext) => void> = [];

  constructor(private config: MatchContextServiceConfig) {}

  getCurrentContext(): MatchContext | null {
    return this.currentContext;
  }

  updateContext(context: MatchContext): void {
    this.currentContext = context;
    this.notifyListeners(context);
  }

  subscribe(listener: (context: MatchContext) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(context: MatchContext): void {
    for (const listener of this.listeners) {
      listener(context);
    }
  }

  createMockContext(): MatchContext {
    return {
      matchId: 'mock-match-1',
      homeTeam: 'Home FC',
      awayTeam: 'Away United',
      currentMinute: 45,
      phase: 'FIRST_HALF',
      homeScore: 1,
      awayScore: 0,
    };
  }
}
