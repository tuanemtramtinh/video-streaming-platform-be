import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConfigSchema } from 'src/config/env.schema';

export const validateEnv = (config: Record<string, unknown>) => {
  const configServer = plainToInstance(ConfigSchema, config, {
    enableImplicitConversion: true,
  });

  const e = validateSync(configServer);

  if (e.length > 0) {
    console.log('Các giá trị trong file .env không hợp lệ');

    const errors = e.map((eItem) => {
      return {
        property: eItem.property,
        constraints: eItem.constraints,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: eItem.value,
      };
    });

    throw new Error(`Invalid environment variables: ${JSON.stringify(errors)}`);
  }

  return configServer;
};
