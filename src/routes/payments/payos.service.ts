import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { Config } from 'src/config/env.schema';

@Injectable()
export class PayOSService {
  readonly client: PayOS;

  constructor(private readonly configService: ConfigService<Config>) {
    this.client = new PayOS({
      clientId: this.configService.get('PAYOS_CLIENT_ID', { infer: true }),
      apiKey: this.configService.get('PAYOS_API_KEY', { infer: true }),
      checksumKey: this.configService.get('PAYOS_CHECKSUM_KEY', {
        infer: true,
      }),
      partnerCode: this.configService.get('PAYOS_PARTNER_CODE', {
        infer: true,
      }),
      baseURL: this.configService.get('PAYOS_BASE_URL', {
        infer: true,
      }),
    });
  }
}
