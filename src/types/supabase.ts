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
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          paddle_transaction_id: string | null
          amount: number | null
          currency: string | null
          status: string
          created_at: string
          credits_added: number
          package_name: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          paddle_transaction_id?: string | null
          amount?: number | null
          currency?: string | null
          status: string
          created_at?: string
          credits_added: number
          package_name: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          paddle_transaction_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string
          created_at?: string
          credits_added?: number
          package_name?: string
          metadata?: Json
        }
      }
      credit_usage: {
        Row: {
          id: string
          user_id: string
          transcription_id: string | null
          credits_used: number
          used_at: string
          description: string | null
        }
        Insert: {
          id?: string
          user_id: string
          transcription_id?: string | null
          credits_used: number
          used_at?: string
          description?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          transcription_id?: string | null
          credits_used?: number
          used_at?: string
          description?: string | null
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
      user_credit_summary: {
        Row: {
          user_id: string | null
          credits_balance: number | null
          total_credits_purchased: number | null
          total_credits_used: number | null
          purchase_count: number | null
          usage_count: number | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
} 