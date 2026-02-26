import { ConfigSchema } from 'src/config/env.schema';
import { safeParse } from 'zod';

export const validateEnv = (config: Record<string, unknown>) => {
  const configServer = safeParse(ConfigSchema, config);

  if (!configServer.success) {
    console.log('Các giá trị trong file .env không hợp lệ');
    console.error(configServer.error);
    process.exit(1);
  }

  return configServer.data;
};
