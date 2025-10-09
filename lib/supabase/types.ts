export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      spots: {
        Row: {
          id: string
          name: string
          slug: string
          region: string
          city: string | null
          country: string
          latitude: number
          longitude: number
          cam_url: string
          cam_type: string
          break_type: string | null
          level: string | null
          orientation: string | null
          best_tide: string | null
          best_wind: string | null
          hazards: string | null
          license_credit: string | null
          shom_url: string | null
          is_active: boolean
          has_daily_forecast: boolean
          timezone: string
          shom_station: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          region: string
          city?: string | null
          country?: string
          latitude: number
          longitude: number
          cam_url: string
          cam_type: string
          break_type?: string | null
          level?: string | null
          orientation?: string | null
          best_tide?: string | null
          best_wind?: string | null
          hazards?: string | null
          license_credit?: string | null
          shom_url?: string | null
          is_active?: boolean
          has_daily_forecast?: boolean
          timezone?: string
          shom_station?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          region?: string
          city?: string | null
          country?: string
          latitude?: number
          longitude?: number
          cam_url?: string
          cam_type?: string
          break_type?: string | null
          level?: string | null
          orientation?: string | null
          best_tide?: string | null
          best_wind?: string | null
          hazards?: string | null
          license_credit?: string | null
          shom_url?: string | null
          is_active?: boolean
          has_daily_forecast?: boolean
          timezone?: string
          shom_station?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          id: string
          user_id: string
          spot_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          spot_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          spot_id?: string
          created_at?: string
        }
      }
      tides: {
        Row: {
          id: string
          spot_id: string
          date: string
          coefficient: string
          tides: Json
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          date: string
          coefficient: string
          tides: Json
          created_at?: string
          updated_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          spot_id?: string
          date?: string
          coefficient?: string
          tides?: Json
          created_at?: string
          updated_at?: string
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

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
