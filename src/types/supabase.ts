// This is a minimal type definition for the Supabase database
// In a real project, you'd generate this from your Supabase schema

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
      transcriptions: {
        Row: {
          id: string
          user_id: string
          transcript_id: string
          status: string
          duration: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          created_at: string
          updated_at: string
          error_message: string | null
          transcription_text: string | null
          metadata: Json
          quality_score: number | null
          reviewed: boolean
          reviewed_at: string | null
          reviewer_notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          transcript_id: string
          status: string
          duration?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          created_at?: string
          updated_at?: string
          error_message?: string | null
          transcription_text?: string | null
          metadata?: Json
          quality_score?: number | null
          reviewed?: boolean
          reviewed_at?: string | null
          reviewer_notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          transcript_id?: string
          status?: string
          duration?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          created_at?: string
          updated_at?: string
          error_message?: string | null
          transcription_text?: string | null
          metadata?: Json
          quality_score?: number | null
          reviewed?: boolean
          reviewed_at?: string | null
          reviewer_notes?: string | null
        }
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          type: string
          provider: string
          created_at: string
          updated_at: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          metadata: Json
          status: string
          settings: Json
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          provider: string
          created_at?: string
          updated_at?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          metadata?: Json
          status?: string
          settings?: Json
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          provider?: string
          created_at?: string
          updated_at?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          metadata?: Json
          status?: string
          settings?: Json
        }
      }
    }
    Views: {
      transcription_analytics: {
        Row: {
          user_id: string | null
          date: string | null
          total_transcriptions: number | null
          completed_transcriptions: number | null
          failed_transcriptions: number | null
          total_duration: number | null
          average_duration: number | null
        }
      }
      quality_control_metrics: {
        Row: {
          user_id: string | null
          total_transcriptions: number | null
          reviewed_transcriptions: number | null
          pending_reviews: number | null
          average_quality_score: number | null
          failed_transcriptions: number | null
          completed_transcriptions: number | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
} 