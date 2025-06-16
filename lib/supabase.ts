import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://cadbsvlemralgljauikj.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZGJzdmxlbXJhbGdsamF1aWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTMwMzIsImV4cCI6MjA2NTU4OTAzMn0.YXDyXnKx1xi1gy2-p_I2Z-Ef90Mk0pJau3rF2VOedFc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      password_reset_codes: {
        Row: {
          id: number
          email: string
          code: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: number
          email: string
          code: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          email?: string
          code?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
      tool_types: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tools: {
        Row: {
          id: number
          name: string
          tool_type_id: number
          quantity: number
          min_stock: number | null
          location: string | null
          condition: string
          purchase_date: string | null
          purchase_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          tool_type_id: number
          quantity?: number
          min_stock?: number | null
          location?: string | null
          condition?: string
          purchase_date?: string | null
          purchase_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          tool_type_id?: number
          quantity?: number
          min_stock?: number | null
          location?: string | null
          condition?: string
          purchase_date?: string | null
          purchase_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: number
          user_name: string
          user_id_type: string
          user_id_number: string
          user_phone: string | null
          user_email: string | null
          loan_date: string
          expected_return_date: string | null
          actual_return_date: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_name: string
          user_id_type?: string
          user_id_number: string
          user_phone?: string | null
          user_email?: string | null
          loan_date?: string
          expected_return_date?: string | null
          actual_return_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_name?: string
          user_id_type?: string
          user_id_number?: string
          user_phone?: string | null
          user_email?: string | null
          loan_date?: string
          expected_return_date?: string | null
          actual_return_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loan_items: {
        Row: {
          id: number
          loan_id: number
          tool_id: number
          quantity_loaned: number
          quantity_returned: number
          condition_loaned: string | null
          condition_returned: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          loan_id: number
          tool_id: number
          quantity_loaned: number
          quantity_returned?: number
          condition_loaned?: string | null
          condition_returned?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          loan_id?: number
          tool_id?: number
          quantity_loaned?: number
          quantity_returned?: number
          condition_loaned?: string | null
          condition_returned?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      loan_statistics: {
        Row: {
          total_loans: number | null
          active_loans: number | null
          completed_loans: number | null
          overdue_loans: number | null
          unique_users: number | null
        }
      }
      inventory_status: {
        Row: {
          id: number | null
          name: string | null
          total_quantity: number | null
          tool_type: string | null
          quantity_on_loan: number | null
          available_quantity: number | null
          min_stock: number | null
          stock_status: string | null
        }
      }
    }
  }
}
