import { BaseError } from './base.error';

export class DatabaseError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 500, details);
  }
}
