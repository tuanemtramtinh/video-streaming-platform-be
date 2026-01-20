import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

const saltRounds = 10;

@Injectable()
export class HashingService {
  hash(value: string): Promise<string> {
    return hash(value, saltRounds);
  }

  compare(value: string, hashedValue: string): Promise<boolean> {
    return compare(value, hashedValue);
  }
}
