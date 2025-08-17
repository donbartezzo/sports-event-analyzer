export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      analysis: {
        Row: {
          id: string;
          user_id: string;
          analysis_type_id: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          analysis_type_id: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          analysis_type_id?: string;
          data?: Json;
          created_at?: string;
        };
      };
      analysis_logs: {
        Row: {
          id: string;
          analysis_id: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          data?: Json;
          created_at?: string;
        };
      };
      analysis_types: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      logs: {
        Row: {
          id: string;
          level: string;
          message: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          level: string;
          message: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: string;
          message?: string;
          data?: Json;
          created_at?: string;
        };
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
}
