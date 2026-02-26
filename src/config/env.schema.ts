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
});

export type Config = z.infer<typeof ConfigSchema>;
