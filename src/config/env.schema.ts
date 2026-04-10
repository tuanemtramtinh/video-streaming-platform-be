import z from 'zod';

export const ConfigSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_ENDPOINT: z.string(),
  S3_BUCKET_NAME: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  PAYOS_CLIENT_ID: z.string(),
  PAYOS_API_KEY: z.string(),
  PAYOS_CHECKSUM_KEY: z.string(),
  PAYOS_RETURN_URL: z
    .string()
    .url()
    .default('http://localhost:3000/payments/return'),
  PAYOS_CANCEL_URL: z
    .string()
    .url()
    .default('http://localhost:3000/payments/cancel'),
  PAYOS_WEBHOOK_URL: z.string().url().optional(),
  PAYOS_PARTNER_CODE: z.string().optional(),
  PAYOS_BASE_URL: z.string().url().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
