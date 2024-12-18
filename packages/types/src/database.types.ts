export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asset: {
        Row: {
          alt_names: string[] | null
          logo: string | null
          name: string
          symbol: string
        }
        Insert: {
          alt_names?: string[] | null
          logo?: string | null
          name: string
          symbol: string
        }
        Update: {
          alt_names?: string[] | null
          logo?: string | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      connection: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          logo: string | null
          name: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          logo?: string | null
          name: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          logo?: string | null
          name?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content: string
          created_at: string | null
          id: number
          title: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          api_key: string
          color: string
          connection_name: string
          created_at: string
          id: number
          last_sync_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          api_key: string
          color?: string
          connection_name: string
          created_at?: string
          id?: number
          last_sync_at?: string | null
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          api_key?: string
          color?: string
          connection_name?: string
          created_at?: string
          id?: number
          last_sync_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_connection_name_fkey"
            columns: ["connection_name"]
            isOneToOne: false
            referencedRelation: "connection"
            referencedColumns: ["name"]
          },
        ]
      }
      portfolio_assets: {
        Row: {
          amount: number
          asset: string
          portfolio_id: number
        }
        Insert: {
          amount?: number
          asset: string
          portfolio_id: number
        }
        Update: {
          amount?: number
          asset?: string
          portfolio_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_assets_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio"
            referencedColumns: ["id"]
          },
        ]
      }
      price: {
        Row: {
          asset: string
          price: number
          time: string
        }
        Insert: {
          asset: string
          price: number
          time?: string
        }
        Update: {
          asset?: string
          price?: number
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_asset_fkey"
            columns: ["asset"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["symbol"]
          },
        ]
      }
      transaction: {
        Row: {
          amount: number | null
          asset: string
          fee: number | null
          hash: string
          id: number
          portfolio_id: number
          time: string | null
          type: string
        }
        Insert: {
          amount?: number | null
          asset: string
          fee?: number | null
          hash: string
          id?: number
          portfolio_id: number
          time?: string | null
          type: string
        }
        Update: {
          amount?: number | null
          asset?: string
          fee?: number | null
          hash?: string
          id?: number
          portfolio_id?: number
          time?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

