/*
  DTO and Command Model Definitions for the API
  This file defines types that directly map to our database models (defined in src/db/database.types.ts) and the API plan.
  We use these types in our endpoints to ensure consistency between the API contracts and database entities.

  NOTE:
  - We re-use the Json type from database.types.ts when needed.
  - For creation commands, certain fields (e.g. auto-generated fields) are omitted and data fields may be renamed for better clarity.
*/

import type { Json, Database } from "./db/database.types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User;
    }
  }
}

// ---------------------
// User DTO
// ---------------------
// Although user management is handled by Supabase Auth, we define a minimal UserDTO for extended profile data.
export interface UserDTO {
  id: string;
  // Additional user fields (e.g. email, username) can be added if needed
  email?: string;
  name?: string;
}

// ---------------------
// Event DTO
// ---------------------
// Represents a sports event that can be analyzed
export interface Event {
  id: string;
  participantA: string;
  participantB: string;
  country: string;
  league: string;
  startTime: string;
}

// Represents a league/competition (subset of upstream API fields we use)
export interface League {
  id: number;
  name: string;
  country?: string | null;
}

// ---------------------
// Analysis DTO and Commands
// ---------------------
// The AnalysisDTO maps directly to the analysis table in the database.
export interface AnalysisDTO {
  id: number;
  user_id: string;
  analysis_type_id: number;
  checksum: string;
  created_at: string;
  generation_time: number | null;
  id_from_api: string;
  parameters: Json;
}

// Command used to create a new Analysis record via POST /analysis
// Now, 'analysis_type_id' is expected to be a number from the start.
export interface CreateAnalysisCommand {
  user_id: string;
  analysis_type_id: number; // analysis_type_id is handled as number (from start)
  parameters: Json;
}

// Command used to update an existing Analysis record via PUT /analysis/{id}
// All properties are optional to allow partial updates.
export type UpdateAnalysisCommand = Partial<CreateAnalysisCommand>;

// ---------------------
// Analysis Pagination
// ---------------------
export interface PaginationParams {
  page?: number;
  limit?: number;
  analysis_type_id?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------
// Analysis Log DTO and Commands
// ---------------------
// AnalysisLogDTO ties the log entry with its parent analysis. In the database,
// analysis_logs table provides the linkage between an analysis and a log (stored in the logs table).
export interface AnalysisLogDTO {
  analysis_id: number;
  id: number; // Unique identifier for the analysis log record
  created_at: string;
  log_id: number; // Reference to the system log entry
  // Additional log details can be merged from the system log if needed
}

// Command used to create a new log entry for an analysis via POST /analysis/{analysis_id}/logs
export interface CreateAnalysisLogCommand {
  message: string;
  timestamp: string; // ISO8601 formatted string
  level: "info" | "warning" | "error";
}

// Command used to update an existing analysis log entry via PUT /analysis/{analysis_id}/logs/{log_id}
export type UpdateAnalysisLogCommand = Partial<CreateAnalysisLogCommand>;

// ---------------------
// Analysis Type DTO
// ---------------------
// Maps directly to the analysis_types table in the database
export interface AnalysisTypeDTO {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

// ---------------------
// System Log DTO and Commands
// ---------------------
// LogDTO represents a system log entry from the logs table
export interface LogDTO {
  id: number;
  event: "general" | "analysis_generator";
  type: "success" | "error" | "info";
  log: Json;
  created_at: string;
  user_id: string | null;
}

// Command to create a new system log entry via POST /logs
export interface CreateLogCommand {
  message: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  meta: Json;
}

// Command to update an existing system log entry via PUT /logs
export type UpdateLogCommand = Partial<CreateLogCommand>;
