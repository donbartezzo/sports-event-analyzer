// @TODO: TMP?
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analysis: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          analysis_type_id: string
          data: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          analysis_type_id: string
          data: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          analysis_type_id?: string
          data?: Json
        }
      }
      analysis_logs: {
        Row: {
          id: string
          created_at: string
          analysis_id: string
          data: Json
        }
        Insert: {
          id?: string
          created_at?: string
          analysis_id: string
          data: Json
        }
        Update: {
          id?: string
          created_at?: string
          analysis_id?: string
          data?: Json
        }
      }
      analysis_types: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
        }
      }
      logs: {
        Row: {
          id: string
          created_at: string
          level: string
          message: string
          data: Json
        }
        Insert: {
          id?: string
          created_at?: string
          level: string
          message: string
          data: Json
        }
        Update: {
          id?: string
          created_at?: string
          level?: string
          message?: string
          data?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
