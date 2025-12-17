export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_controls: {
        Row: {
          id: string;
          investment_growth_mode: string | null;
          last_applied: string | null;
          roi_adjustment_rate: number | null;
        };
        Insert: {
          id?: string;
          investment_growth_mode?: string | null;
          last_applied?: string | null;
          roi_adjustment_rate?: number | null;
        };
        Update: {
          id?: string;
          investment_growth_mode?: string | null;
          last_applied?: string | null;
          roi_adjustment_rate?: number | null;
        };
        Relationships: [];
      };
      investment_plans: {
        Row: {
          created_at: string | null;
          description: string | null;
          duration_months: number | null;
          id: string;
          max_investment: number | null;
          min_investment: number;
          name: string;
          risk_level: string | null;
          roi_rate: number;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          duration_months?: number | null;
          id?: string;
          max_investment?: number | null;
          min_investment: number;
          name: string;
          risk_level?: string | null;
          roi_rate: number;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          duration_months?: number | null;
          id?: string;
          max_investment?: number | null;
          min_investment?: number;
          name?: string;
          risk_level?: string | null;
          roi_rate?: number;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          amount_invested: number;
          created_at: string | null;
          duration_months: number | null;
          end_date: string | null;
          id: string;
          investment_type:
            | Database['public']['Enums']['investment_type_enum']
            | null;
          roi_amount: number | null;
          roi_rate: number;
          sanity_id: string | null;
          start_date: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount_invested: number;
          created_at?: string | null;
          duration_months?: number | null;
          end_date?: string | null;
          id?: string;
          investment_type?:
            | Database['public']['Enums']['investment_type_enum']
            | null;
          roi_amount?: number | null;
          roi_rate: number;
          sanity_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount_invested?: number;
          created_at?: string | null;
          duration_months?: number | null;
          end_date?: string | null;
          id?: string;
          investment_type?:
            | Database['public']['Enums']['investment_type_enum']
            | null;
          roi_amount?: number | null;
          roi_rate?: number;
          sanity_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'investments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string | null;
          id: string;
          investment_id: string | null;
          payment_method: string | null;
          status: string | null;
          tx_hash: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string | null;
          id?: string;
          investment_id?: string | null;
          payment_method?: string | null;
          status?: string | null;
          tx_hash?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string | null;
          id?: string;
          investment_id?: string | null;
          payment_method?: string | null;
          status?: string | null;
          tx_hash?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_confirmed_by_fkey';
            columns: ['confirmed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_investment_id_fkey';
            columns: ['investment_id'];
            isOneToOne: false;
            referencedRelation: 'investments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string;
          full_name: string;
          id: string;
          phone_number: string | null;
          wallet_address: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          full_name: string;
          id: string;
          phone_number?: string | null;
          wallet_address?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          phone_number?: string | null;
          wallet_address?: string | null;
        };
        Relationships: [];
      };
      roi_history: {
        Row: {
          adjustment_rate: number | null;
          changed_by: string | null;
          created_at: string | null;
          growth_direction: string | null;
          id: string;
          investment_type: string;
          new_roi: number | null;
          previous_roi: number | null;
        };
        Insert: {
          adjustment_rate?: number | null;
          changed_by?: string | null;
          created_at?: string | null;
          growth_direction?: string | null;
          id?: string;
          investment_type: string;
          new_roi?: number | null;
          previous_roi?: number | null;
        };
        Update: {
          adjustment_rate?: number | null;
          changed_by?: string | null;
          created_at?: string | null;
          growth_direction?: string | null;
          id?: string;
          investment_type?: string;
          new_roi?: number | null;
          previous_roi?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'roi_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      roi_settings: {
        Row: {
          adjustment_rate: number | null;
          base_roi: number | null;
          growth_direction: string | null;
          id: string;
          investment_type: string;
          last_updated: string | null;
          updated_by: string | null;
        };
        Insert: {
          adjustment_rate?: number | null;
          base_roi?: number | null;
          growth_direction?: string | null;
          id?: string;
          investment_type: string;
          last_updated?: string | null;
          updated_by?: string | null;
        };
        Update: {
          adjustment_rate?: number | null;
          base_roi?: number | null;
          growth_direction?: string | null;
          id?: string;
          investment_type?: string;
          last_updated?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'roi_settings_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role_id: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          role_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          role_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      crypto_wallets: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          wallet_address: string;
          enabled: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          wallet_address: string;
          enabled?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          symbol?: string;
          name?: string;
          wallet_address?: string;
          enabled?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string | null;
          fees: number | null;
          id: string;
          metadata: Json | null;
          provider: string | null;
          provider_txn_id: string | null;
          related_object: Json | null;
          status: string | null;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency?: string | null;
          fees?: number | null;
          id?: string;
          metadata?: Json | null;
          provider?: string | null;
          provider_txn_id?: string | null;
          related_object?: Json | null;
          status?: string | null;
          type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string | null;
          fees?: number | null;
          id?: string;
          metadata?: Json | null;
          provider?: string | null;
          provider_txn_id?: string | null;
          related_object?: Json | null;
          status?: string | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          first_name: string;
          id: string;
          last_login: string | null;
          last_name: string;
          permissions: string[] | null;
          role: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          first_name: string;
          id: string;
          last_login?: string | null;
          last_name: string;
          permissions?: string[] | null;
          role?: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          first_name?: string;
          id?: string;
          last_login?: string | null;
          last_name?: string;
          permissions?: string[] | null;
          role?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'auth.users';
            referencedColumns: ['id'];
          },
        ];
      };
      referrals: {
        Row: {
          commission_amount: number;
          commission_paid: boolean;
          created_at: string;
          first_investment_amount: number | null;
          first_investment_date: string | null;
          id: string;
          metadata: Json;
          referee_id: string;
          referrer_id: string;
          referral_code: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          commission_amount?: number;
          commission_paid?: boolean;
          created_at?: string;
          first_investment_amount?: number | null;
          first_investment_date?: string | null;
          id?: string;
          metadata?: Json;
          referee_id: string;
          referrer_id: string;
          referral_code: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          commission_amount?: number;
          commission_paid?: boolean;
          created_at?: string;
          first_investment_amount?: number | null;
          first_investment_date?: string | null;
          id?: string;
          metadata?: Json;
          referee_id?: string;
          referrer_id?: string;
          referral_code?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'referrals_referee_id_fkey';
            columns: ['referee_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      investment_type_enum: 'crypto' | 'property' | 'plan';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      investment_type_enum: ['crypto', 'property', 'plan'],
    },
  },
} as const;
