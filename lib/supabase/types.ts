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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          locale: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          locale?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          locale?: string
          created_at?: string
          updated_at?: string
        }
      }
      spots: {
        Row: {
          id: string
          slug: string
          name: string
          country: string
          region: string
          city: string | null
          latitude: number
          longitude: number
          timezone: string
          break_type: string | null
          orientation: string | null
          level: string | null
          hazards: string | null
          best_tide: string | null
          best_wind: string | null
          cam_url: string
          cam_type: string
          license_credit: string | null
          is_active: boolean
          has_daily_forecast: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          country: string
          region: string
          city?: string | null
          latitude: number
          longitude: number
          timezone: string
          break_type?: string | null
          orientation?: string | null
          level?: string | null
          hazards?: string | null
          best_tide?: string | null
          best_wind?: string | null
          cam_url: string
          cam_type: string
          license_credit?: string | null
          is_active?: boolean
          has_daily_forecast?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          country?: string
          region?: string
          city?: string | null
          latitude?: number
          longitude?: number
          timezone?: string
          break_type?: string | null
          orientation?: string | null
          level?: string | null
          hazards?: string | null
          best_tide?: string | null
          best_wind?: string | null
          cam_url?: string
          cam_type?: string
          license_credit?: string | null
          is_active?: boolean
          has_daily_forecast?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          user_id: string
          spot_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          spot_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          spot_id?: string
          created_at?: string
        }
      }
      spot_forecast_cache: {
        Row: {
          id: string
          spot_id: string
          payload: Json
          fetched_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          payload: Json
          fetched_at?: string
        }
        Update: {
          id?: string
          spot_id?: string
          payload?: Json
          fetched_at?: string
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
