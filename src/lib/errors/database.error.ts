import { BaseError } from "./base.error";

export class DatabaseError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, 500, details);
  }
}
