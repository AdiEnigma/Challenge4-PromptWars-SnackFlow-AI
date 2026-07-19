/**
 * SnackFlow AI - InfluxDB connection and schema setup
 *
 * InfluxDB has no server-side "CREATE TABLE" in the SQL sense; instead we
 * ensure the target bucket exists and document the measurement schemas that
 * the application writes. The measurement/tag/field definitions below mirror
 * database-guide.md and are asserted by the write helpers in this module.
 */
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';
import { dbConfig } from '../config';
import { logger } from '../logger';

export const influx = new InfluxDB({
  url: dbConfig.influx.url,
  token: dbConfig.influx.token,
});

export const writeApi = influx.getWriteApi(dbConfig.influx.org, dbConfig.influx.bucket, 'ms');
export const queryApi = influx.getQueryApi(dbConfig.influx.org);

/**
 * Measurement schemas as documented in database-guide.md. Each entry lists the
 * tag keys and field keys so writers and readers stay consistent.
 */
export const MEASUREMENTS = {
  demand_forecasts: {
    tags: ['stall_id', 'food_item_id', 'prediction_window'],
    fields: [
      'estimated_demand',
      'confidence',
      'intent_score',
      'queue_length',
      'inventory_level',
      'crowd_density',
      'weather_temp',
      'match_minute',
    ],
  },
  swipe_aggregated: {
    tags: ['food_item_id', 'location_section'],
    fields: ['interested_count', 'not_interested_count', 'intent_score'],
  },
  lost_sales: {
    tags: ['stall_id', 'food_item_id', 'match_id'],
    fields: ['duration_minutes', 'fans_affected', 'estimated_revenue'],
  },
  prediction_accuracy: {
    tags: ['stall_id', 'food_item_id'],
    fields: ['predicted_demand', 'actual_demand', 'absolute_error', 'percentage_error'],
  },
} as const;

export type MeasurementName = keyof typeof MEASUREMENTS;

/** Ensure the target bucket exists, creating it if missing. */
export async function ensureBucket(retentionHours = 24 * 30): Promise<void> {
  const orgsApi = new OrgsAPI(influx);
  const bucketsApi = new BucketsAPI(influx);

  const orgs = await orgsApi.getOrgs({ org: dbConfig.influx.org });
  const orgId = orgs.orgs?.[0]?.id;
  if (!orgId) {
    throw new Error(`InfluxDB org "${dbConfig.influx.org}" not found`);
  }

  const existing = await bucketsApi.getBuckets({ name: dbConfig.influx.bucket });
  if (existing.buckets && existing.buckets.length > 0) {
    logger.info(`InfluxDB bucket "${dbConfig.influx.bucket}" already exists`);
    return;
  }

  await bucketsApi.postBuckets({
    body: {
      orgID: orgId,
      name: dbConfig.influx.bucket,
      retentionRules: [
        { type: 'expire', everySeconds: retentionHours * 3600 },
      ],
    },
  });
  logger.info(`InfluxDB bucket "${dbConfig.influx.bucket}" created`);
}

/** Build a typed Point for a given measurement with its tag/field validation. */
export function buildPoint(
  measurement: MeasurementName,
  tags: Record<string, string>,
  fields: Record<string, string | number | boolean>,
  timestamp?: Date,
): Point {
  const schema = MEASUREMENTS[measurement];
  const point = new Point(measurement);

  for (const tag of schema.tags) {
    if (tags[tag] !== undefined) point.tag(tag, String(tags[tag]));
  }
  for (const field of schema.fields) {
    const value = fields[field];
    if (value === undefined) continue;
    if (typeof value === 'number') {
      if (Number.isInteger(value)) point.intField(field, value);
      else point.floatField(field, value);
    } else if (typeof value === 'boolean') {
      point.booleanField(field, value);
    } else {
      point.stringField(field, value);
    }
  }
  if (timestamp) point.timestamp(timestamp);
  return point;
}

export async function initInflux(): Promise<void> {
  await ensureBucket(dbConfig.influx.retentionHours);
  await writeApi.flush();
  logger.info('InfluxDB initialized');
}
