export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  surf: {
    Tables: {
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
          created_at: string | null
          updated_at: string | null
          has_daily_forecast: boolean
          shom_station: string | null
          shom_url: string | null
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
          timezone?: string
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
          created_at?: string | null
          updated_at?: string | null
          has_daily_forecast?: boolean
          shom_station?: string | null
          shom_url?: string | null
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
          created_at?: string | null
          updated_at?: string | null
          has_daily_forecast?: boolean
          shom_station?: string | null
          shom_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          locale: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          locale?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          locale?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      favorites: {
        Row: {
          user_id: string
          spot_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          spot_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          spot_id?: string
          created_at?: string | null
        }
      }
      spot_forecast_cache: {
        Row: {
          id: string
          spot_id: string
          payload: Json
          fetched_at: string | null
          source: string | null
          valid_until: string | null
          data_start: string | null
          data_end: string | null
        }
        Insert: {
          id?: string
          spot_id: string
          payload: Json
          fetched_at?: string | null
          source?: string | null
          valid_until?: string | null
          data_start?: string | null
          data_end?: string | null
        }
        Update: {
          id?: string
          spot_id?: string
          payload?: Json
          fetched_at?: string | null
          source?: string | null
          valid_until?: string | null
          data_start?: string | null
          data_end?: string | null
        }
      }
      stormglass_api_calls: {
        Row: {
          id: string
          call_date: string
          call_count: number
          last_reset_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          call_date?: string
          call_count?: number
          last_reset_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          call_date?: string
          call_count?: number
          last_reset_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stormglass_logs: {
        Row: {
          id: string
          spot_id: string | null
          endpoint: string
          status: string
          response_summary: Json | null
          error_message: string | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          spot_id?: string | null
          endpoint: string
          status: string
          response_summary?: Json | null
          error_message?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          spot_id?: string | null
          endpoint?: string
          status?: string
          response_summary?: Json | null
          error_message?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
        }
      }
      tides: {
        Row: {
          id: string
          spot_id: string
          date: string
          coefficient: string
          tides: Json
          created_at: string | null
          updated_at: string | null
          expires_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          date: string
          coefficient: string
          tides: Json
          created_at?: string | null
          updated_at?: string | null
          expires_at: string
        }
        Update: {
          id?: string
          spot_id?: string
          date?: string
          coefficient?: string
          tides?: Json
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string
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

// Helper types ciblant le schema "surf"
export type Tables<T extends keyof Database['surf']['Tables']> = Database['surf']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['surf']['Tables']> = Database['surf']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['surf']['Tables']> = Database['surf']['Tables'][T]['Update']
