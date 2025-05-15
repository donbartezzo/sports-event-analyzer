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
          id: number
          user_id: string
          analysis_type_id: number
          parameters: Json
          checksum: string
          id_from_api: string
          created_at: string
          generation_time: number | null
        }
        Insert: {
          id?: number
          user_id: string
          analysis_type_id: number
          parameters: Json
          checksum: string
          id_from_api: string
          created_at?: string
          generation_time?: number | null
        }
        Update: {
          id?: number
          user_id?: string
          analysis_type_id?: number
          parameters?: Json
          checksum?: string
          id_from_api?: string
          created_at?: string
          generation_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_analysis_type_id_fkey"
            columns: ["analysis_type_id"]
            referencedRelation: "analysis_types"
            referencedColumns: ["id"]
          }
        ]
      }
      analysis_types: {
        Row: {
          id: number
          name: string
          description: string | null
          parameters_schema: Json
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          parameters_schema: Json
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          parameters_schema?: Json
          created_at?: string
        }
        Relationships: []
      }
      analysis_logs: {
        Row: {
          id: number
          analysis_id: number
          message: string
          level: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: number
          analysis_id: number
          message: string
          level: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: number
          analysis_id?: number
          message?: string
          level?: string
          created_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_logs_analysis_id_fkey"
            columns: ["analysis_id"]
            referencedRelation: "analysis"
            referencedColumns: ["id"]
          }
        ]
      }
      logs: {
        Row: {
          id: number
          message: string
          level: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: number
          message: string
          level: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: number
          message?: string
          level?: string
          created_at?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          bio: string | null
          preferred_analysis_type: string | null
          email_notifications: boolean
          push_notifications: boolean
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          bio?: string | null
          preferred_analysis_type?: string | null
          email_notifications?: boolean
          push_notifications?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          bio?: string | null
          preferred_analysis_type?: string | null
          email_notifications?: boolean
          push_notifications?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
