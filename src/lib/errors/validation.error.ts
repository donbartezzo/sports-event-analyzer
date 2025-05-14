import { BaseError } from './base.error';

export class ValidationError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}
