import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrls: (process.env.FRONTEND_URLS || 'http://localhost:5173').split(','),

  pg: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'snackflow',
    password: process.env.PGPASSWORD || 'snackflow_secret',
    database: process.env.PGDATABASE || 'snackflow_ai',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  influx: {
    url: process.env.INFLUX_URL || 'http://localhost:8086',
    token: process.env.INFLUX_TOKEN || 'snackflow-token',
    org: process.env.INFLUX_ORG || 'snackflow',
    bucket: process.env.INFLUX_BUCKET || 'snackflow_ai',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    email: process.env.VAPID_EMAIL || 'mailto:admin@snackflow.ai',
  },

  translation: {
    googleApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    awsRegion: process.env.AWS_TRANSLATE_REGION || 'us-east-1',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
