import z from 'zod';

export const ConfigSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;
