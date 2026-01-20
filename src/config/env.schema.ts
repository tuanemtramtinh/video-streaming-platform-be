import { IsNumber, IsString } from 'class-validator';

export class ConfigSchema {
  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  PORT: number;

  @IsString()
  ACCESS_TOKEN_SECRET: string;

  @IsString()
  ACCESS_TOKEN_EXPIRES_IN: string;

  @IsString()
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  REFRESH_TOKEN_EXPIRES_IN: string;
}
