/**
 * SnackFlow AI - InfluxDB setup
 * Ensures the bucket exists and writes the measurement schemas as a marker.
 * Run: ts-node database/scripts/setup-influx.ts
 */
import { influx, writeApi, ensureBucket, MEASUREMENTS } from '../influxdb/client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';
import { dbConfig } from '../config';
import { logger } from '../logger';

export async function setupInflux(): Promise<void> {
  await ensureBucket();
  logger.info('influx', `ready: org=${dbConfig.influx.org} bucket=${dbConfig.influx.bucket}`);
  logger.info('influx', `measurements: ${Object.keys(MEASUREMENTS).join(', ')}`);
  await writeApi.flush();
}

if (require.main === module) {
  setupInflux()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('influx', 'setup failed', err);
      process.exit(1);
    });
}
