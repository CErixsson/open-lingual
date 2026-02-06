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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cefr_band_config: {
        Row: {
          band_max: number
          band_min: number
          created_at: string
          id: string
          language_id: string
          level: string
        }
        Insert: {
          band_max: number
          band_min: number
          created_at?: string
          id?: string
          language_id: string
          level: string
        }
        Update: {
          band_max?: number
          band_min?: number
          created_at?: string
          id?: string
          language_id?: string
          level?: string
        }
        Relationships: [
          {
            foreignKeyName: "cefr_band_config_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty_elo_after: number
          difficulty_elo_before: number
          elo_after: number
          elo_before: number
          exercise_id: string
          expected_score: number
          id: string
          k_factor_used: number
          passed: boolean
          rd_after: number
          rd_before: number
          score_raw: number
          skill_id: string
          started_at: string
          time_spent_sec: number | null
          user_id: string
          user_language_profile_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty_elo_after: number
          difficulty_elo_before: number
          elo_after: number
          elo_before: number
          exercise_id: string
          expected_score: number
          id?: string
          k_factor_used: number
          passed?: boolean
          rd_after: number
          rd_before: number
          score_raw?: number
          skill_id: string
          started_at?: string
          time_spent_sec?: number | null
          user_id: string
          user_language_profile_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty_elo_after?: number
          difficulty_elo_before?: number
          elo_after?: number
          elo_before?: number
          exercise_id?: string
          expected_score?: number
          id?: string
          k_factor_used?: number
          passed?: boolean
          rd_after?: number
          rd_before?: number
          score_raw?: number
          skill_id?: string
          started_at?: string
          time_spent_sec?: number | null
          user_id?: string
          user_language_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_user_language_profile_id_fkey"
            columns: ["user_language_profile_id"]
            isOneToOne: false
            referencedRelation: "user_language_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          difficulty_elo: number
          id: string
          is_adaptive: boolean
          language_id: string
          skill_id: string
          status: string
          tags: string[] | null
          time_limit_sec: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          difficulty_elo?: number
          id?: string
          is_adaptive?: boolean
          language_id: string
          skill_id: string
          status?: string
          tags?: string[] | null
          time_limit_sec?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          difficulty_elo?: number
          id?: string
          is_adaptive?: boolean
          language_id?: string
          skill_id?: string
          status?: string
          tags?: string[] | null
          time_limit_sec?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      language_progress: {
        Row: {
          created_at: string
          id: string
          language_code: string
          lessons_completed: number
          level: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_code: string
          lessons_completed?: number
          level?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language_code?: string
          lessons_completed?: number
          level?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          display_name: string | null
          id: string
          language_id: string
          period: string
          rank: number
          rating_snapshot: number
          skill_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          language_id: string
          period: string
          rank: number
          rating_snapshot: number
          skill_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          language_id?: string
          period?: string
          rank?: number
          rating_snapshot?: number
          skill_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_language: string | null
          display_name: string | null
          id: string
          last_activity_date: string | null
          streak_days: number
          updated_at: string
          user_id: string
          xp_points: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_language?: string | null
          display_name?: string | null
          id?: string
          last_activity_date?: string | null
          streak_days?: number
          updated_at?: string
          user_id: string
          xp_points?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_language?: string | null
          display_name?: string | null
          id?: string
          last_activity_date?: string | null
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp_points?: number
        }
        Relationships: []
      }
      skills: {
        Row: {
          display_name: string
          icon_name: string | null
          id: string
          key: string
        }
        Insert: {
          display_name: string
          icon_name?: string | null
          id?: string
          key: string
        }
        Update: {
          display_name?: string
          icon_name?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      user_language_profiles: {
        Row: {
          created_at: string
          id: string
          language_id: string
          last_active_at: string | null
          overall_cefr: string
          overall_elo: number
          overall_rd: number
          streak_count: number
          total_attempts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_id: string
          last_active_at?: string | null
          overall_cefr?: string
          overall_elo?: number
          overall_rd?: number
          streak_count?: number
          total_attempts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language_id?: string
          last_active_at?: string | null
          overall_cefr?: string
          overall_elo?: number
          overall_rd?: number
          streak_count?: number
          total_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_language_profiles_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_ratings: {
        Row: {
          attempts_count: number
          created_at: string
          elo: number
          id: string
          last_update_at: string | null
          rd: number
          skill_id: string
          user_language_profile_id: string
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          elo?: number
          id?: string
          last_update_at?: string | null
          rd?: number
          skill_id: string
          user_language_profile_id: string
        }
        Update: {
          attempts_count?: number
          created_at?: string
          elo?: number
          id?: string
          last_update_at?: string | null
          rd?: number
          skill_id?: string
          user_language_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_ratings_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skill_ratings_user_language_profile_id_fkey"
            columns: ["user_language_profile_id"]
            isOneToOne: false
            referencedRelation: "user_language_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_k_factor: {
        Args: { p_attempts: number; p_elo: number; p_rd: number }
        Returns: number
      }
      map_elo_to_cefr: {
        Args: { p_elo: number; p_language_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
