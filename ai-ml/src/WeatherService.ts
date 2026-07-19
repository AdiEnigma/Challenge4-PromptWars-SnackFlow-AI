export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  cachedAt: Date;
}

export interface WeatherServiceConfig {
  apiKey: string;
  cacheTtlSeconds: number;
  pollIntervalSeconds: number;
}

export class WeatherService {
  private config: WeatherServiceConfig;
  private cache: Map<string, { data: WeatherData; expiresAt: Date }> = new Map();

  constructor(config: WeatherServiceConfig) {
    this.config = config;
  }

  async getCurrentWeather(stadiumId: string): Promise<WeatherData> {
    const cached = this.cache.get(stadiumId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }

    const data = await this.fetchFromAPI(stadiumId);
    this.cache.set(stadiumId, {
      data,
      expiresAt: new Date(Date.now() + this.config.cacheTtlSeconds * 1000),
    });

    return data;
  }

  private async fetchFromAPI(stadiumId: string): Promise<WeatherData> {
    const mockData: WeatherData = {
      temperature: 22,
      condition: 'clear',
      humidity: 45,
      windSpeed: 10,
      cachedAt: new Date(),
    };

    return mockData;
  }

  async refreshWeather(stadiumId: string): Promise<WeatherData> {
    this.cache.delete(stadiumId);
    return this.getCurrentWeather(stadiumId);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
