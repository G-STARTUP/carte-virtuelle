export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      card_transactions: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          merchant_category: string | null
          merchant_name: string | null
          raw_data: Json | null
          status: string | null
          transaction_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          merchant_category?: string | null
          merchant_name?: string | null
          raw_data?: Json | null
          status?: string | null
          transaction_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          merchant_category?: string | null
          merchant_name?: string | null
          raw_data?: Json | null
          status?: string | null
          transaction_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "strowallet_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "card_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fees_settings: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type_enum"]
          document_url: string
          id: string
          rejection_reason: string | null
          uploaded_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type_enum"]
          document_url: string
          id?: string
          rejection_reason?: string | null
          uploaded_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type_enum"]
          document_url?: string
          id?: string
          rejection_reason?: string | null
          uploaded_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moneroo_payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_id: string
          raw_response: Json | null
          return_url: string
          status: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          currency: string
          id?: string
          metadata?: Json | null
          payment_id: string
          raw_response?: Json | null
          return_url: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_id?: string
          raw_response?: Json | null
          return_url?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moneroo_payments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      nowpayments_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          raw_response: Json | null
          status: string
          sub_partner_id: string
          transfer_id: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          raw_response?: Json | null
          status?: string
          sub_partner_id: string
          transfer_id: string
          type: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          raw_response?: Json | null
          status?: string
          sub_partner_id?: string
          transfer_id?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nowpayments_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status_enum"]
          last_name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status_enum"]
          last_name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status_enum"]
          last_name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      strowallet_api_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          function_name: string
          id: string
          ip_address: string | null
          request_payload: Json | null
          response_data: Json | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name: string
          id?: string
          ip_address?: string | null
          request_payload?: Json | null
          response_data?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name?: string
          id?: string
          ip_address?: string | null
          request_payload?: Json | null
          response_data?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      strowallet_cards: {
        Row: {
          balance: number
          card_id: string
          card_number: string | null
          card_type: string | null
          created_at: string
          currency: string | null
          customer_id: string | null
          cvv: string | null
          expiry_month: string | null
          expiry_year: string | null
          id: string
          name_on_card: string | null
          raw_response: Json | null
          status: Database["public"]["Enums"]["card_status_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          card_id: string
          card_number?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          cvv?: string | null
          expiry_month?: string | null
          expiry_year?: string | null
          id?: string
          name_on_card?: string | null
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["card_status_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          card_id?: string
          card_number?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          cvv?: string | null
          expiry_month?: string | null
          expiry_year?: string | null
          id?: string
          name_on_card?: string | null
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["card_status_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strowallet_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "strowallet_customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "strowallet_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strowallet_customers: {
        Row: {
          created_at: string
          customer_email: string
          customer_id: string
          data: Json | null
          first_name: string | null
          id: string
          id_image_url: string | null
          last_name: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          user_photo_url: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_id: string
          data?: Json | null
          first_name?: string | null
          id?: string
          id_image_url?: string | null
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          user_photo_url?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_id?: string
          data?: Json | null
          first_name?: string | null
          id?: string
          id_image_url?: string | null
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          user_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strowallet_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strowallet_webhook_events: {
        Row: {
          card_id: string | null
          event_id: string
          event_type: string
          id: string
          inserted_at: string
          payload: Json
          processed: boolean
          signature_valid: boolean
          user_id: string | null
        }
        Insert: {
          card_id?: string | null
          event_id: string
          event_type: string
          id?: string
          inserted_at?: string
          payload: Json
          processed?: boolean
          signature_valid?: boolean
          user_id?: string | null
        }
        Update: {
          card_id?: string | null
          event_id?: string
          event_type?: string
          id?: string
          inserted_at?: string
          payload?: Json
          processed?: boolean
          signature_valid?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strowallet_webhook_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_enum"]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_enum"]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_enum"]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      card_status_enum: "active" | "frozen" | "inactive" | "blocked"
      currency_enum: "USD" | "NGN" | "XOF"
      document_type_enum: "id_card" | "passport" | "driver_license"
      kyc_status_enum: "not_verified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      card_status_enum: ["active", "frozen", "inactive", "blocked"],
      currency_enum: ["USD", "NGN", "XOF"],
      document_type_enum: ["id_card", "passport", "driver_license"],
      kyc_status_enum: ["not_verified", "pending", "verified", "rejected"],
    },
  },
} as const
