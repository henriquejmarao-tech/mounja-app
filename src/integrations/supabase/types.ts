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
      community_group_members: {
        Row: {
          created_at: string
          group_id: string
          hidden: boolean
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          hidden?: boolean
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          hidden?: boolean
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string
          id: string
          invite_code: string | null
          is_private: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string
          id?: string
          invite_code?: string | null
          is_private?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string
          id?: string
          invite_code?: string | null
          is_private?: boolean
          name?: string
        }
        Relationships: []
      }
      community_questions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          appetite: number | null
          body_fat_pct: number | null
          created_at: string | null
          date: string
          energy: number | null
          food_notes: string | null
          food_quality: string | null
          hip_cm: number | null
          id: string
          mood: number | null
          notes: string | null
          satiety: number | null
          symptom_constipation: number | null
          symptom_diarrhea: number | null
          symptom_fatigue: number | null
          symptom_headache: number | null
          symptom_injection_pain: number | null
          symptom_nausea: number | null
          user_id: string
          waist_cm: number | null
          water_ml: number | null
          weight: number | null
          workout_duration: number | null
          workout_type: string | null
        }
        Insert: {
          appetite?: number | null
          body_fat_pct?: number | null
          created_at?: string | null
          date: string
          energy?: number | null
          food_notes?: string | null
          food_quality?: string | null
          hip_cm?: number | null
          id?: string
          mood?: number | null
          notes?: string | null
          satiety?: number | null
          symptom_constipation?: number | null
          symptom_diarrhea?: number | null
          symptom_fatigue?: number | null
          symptom_headache?: number | null
          symptom_injection_pain?: number | null
          symptom_nausea?: number | null
          user_id: string
          waist_cm?: number | null
          water_ml?: number | null
          weight?: number | null
          workout_duration?: number | null
          workout_type?: string | null
        }
        Update: {
          appetite?: number | null
          body_fat_pct?: number | null
          created_at?: string | null
          date?: string
          energy?: number | null
          food_notes?: string | null
          food_quality?: string | null
          hip_cm?: number | null
          id?: string
          mood?: number | null
          notes?: string | null
          satiety?: number | null
          symptom_constipation?: number | null
          symptom_diarrhea?: number | null
          symptom_fatigue?: number | null
          symptom_headache?: number | null
          symptom_injection_pain?: number | null
          symptom_nausea?: number | null
          user_id?: string
          waist_cm?: number | null
          water_ml?: number | null
          weight?: number | null
          workout_duration?: number | null
          workout_type?: string | null
        }
        Relationships: []
      }
      daily_meal_credits: {
        Row: {
          created_at: string
          credits_max: number
          credits_used: number
          date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_max?: number
          credits_used?: number
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_max?: number
          credits_used?: number
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_suggestions: {
        Row: {
          breakfast: string | null
          calories_target: number | null
          context_note: string | null
          created_at: string | null
          date: string
          dinner: string | null
          id: string
          lunch: string | null
          protein_target: number | null
          snack: string | null
          tip: string | null
          user_id: string
        }
        Insert: {
          breakfast?: string | null
          calories_target?: number | null
          context_note?: string | null
          created_at?: string | null
          date?: string
          dinner?: string | null
          id?: string
          lunch?: string | null
          protein_target?: number | null
          snack?: string | null
          tip?: string | null
          user_id: string
        }
        Update: {
          breakfast?: string | null
          calories_target?: number | null
          context_note?: string | null
          created_at?: string | null
          date?: string
          dinner?: string | null
          id?: string
          lunch?: string | null
          protein_target?: number | null
          snack?: string | null
          tip?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dose_reminders_sent: {
        Row: {
          id: string
          scheduled_dose_at: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          scheduled_dose_at: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          scheduled_dose_at?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          rating: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          rating?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          rating?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      founder_user_metadata: {
        Row: {
          contacted_by: string | null
          created_at: string
          instagram_handle: string | null
          notes: string | null
          talked_at: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          contacted_by?: string | null
          created_at?: string
          instagram_handle?: string | null
          notes?: string | null
          talked_at?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          contacted_by?: string | null
          created_at?: string
          instagram_handle?: string | null
          notes?: string | null
          talked_at?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      injections: {
        Row: {
          applied_at: string | null
          created_at: string | null
          date: string
          dose: string
          id: string
          medication: string | null
          notes: string | null
          site: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          date: string
          dose: string
          id?: string
          medication?: string | null
          notes?: string | null
          site?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          date?: string
          dose?: string
          id?: string
          medication?: string | null
          notes?: string | null
          site?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          ai_analysis: Json | null
          calories: number | null
          created_at: string
          date: string
          description: string | null
          fiber: number | null
          id: string
          meal_time: string
          photo_url: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          calories?: number | null
          created_at?: string
          date?: string
          description?: string | null
          fiber?: number | null
          id?: string
          meal_time?: string
          photo_url?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          calories?: number | null
          created_at?: string
          date?: string
          description?: string | null
          fiber?: number | null
          id?: string
          meal_time?: string
          photo_url?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      premium_access: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          promo_code: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          promo_code?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          promo_code?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          appetite_effect: number | null
          application_day: string | null
          application_frequency: string | null
          application_interval_days: number | null
          avg_sleep_hours: number | null
          calories_goal: number | null
          common_side_effects: Json | null
          compulsion_effect: number | null
          created_at: string | null
          current_dose: string | null
          current_weight: number | null
          daily_water_ml: number | null
          dietary_restrictions: Json | null
          dose_history_completed: boolean | null
          dose_increase_details: string | null
          fiber_goal: number | null
          first_login_at: string | null
          goal: string | null
          has_increased_dose: boolean | null
          has_medical_guidance: boolean | null
          health_conditions: Json | null
          health_info_completed: boolean | null
          height_cm: number | null
          id: string
          medical_specialty: string | null
          medication: string | null
          medications: string | null
          mounjaro_start_date: string | null
          name: string | null
          next_dose_scheduled_at: string | null
          preferred_application_time: string | null
          protein_goal: number | null
          push_permission_asked_at: string | null
          routine_completed: boolean | null
          satiety_effect: number | null
          selected_plan: string | null
          sex: string | null
          side_effects_improvement: string | null
          side_effects_worsening: string | null
          subscription_seen: boolean | null
          tracking_preference: string | null
          triage_completed: boolean | null
          tutorial_hints_seen: Json | null
          tutorial_step: number | null
          tutorial_version_completed: string | null
          updated_at: string | null
          username: string | null
          water_glasses_goal: number | null
          weekly_workout_goal: number | null
          weekly_workouts: number | null
          weight_goal: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          appetite_effect?: number | null
          application_day?: string | null
          application_frequency?: string | null
          application_interval_days?: number | null
          avg_sleep_hours?: number | null
          calories_goal?: number | null
          common_side_effects?: Json | null
          compulsion_effect?: number | null
          created_at?: string | null
          current_dose?: string | null
          current_weight?: number | null
          daily_water_ml?: number | null
          dietary_restrictions?: Json | null
          dose_history_completed?: boolean | null
          dose_increase_details?: string | null
          fiber_goal?: number | null
          first_login_at?: string | null
          goal?: string | null
          has_increased_dose?: boolean | null
          has_medical_guidance?: boolean | null
          health_conditions?: Json | null
          health_info_completed?: boolean | null
          height_cm?: number | null
          id: string
          medical_specialty?: string | null
          medication?: string | null
          medications?: string | null
          mounjaro_start_date?: string | null
          name?: string | null
          next_dose_scheduled_at?: string | null
          preferred_application_time?: string | null
          protein_goal?: number | null
          push_permission_asked_at?: string | null
          routine_completed?: boolean | null
          satiety_effect?: number | null
          selected_plan?: string | null
          sex?: string | null
          side_effects_improvement?: string | null
          side_effects_worsening?: string | null
          subscription_seen?: boolean | null
          tracking_preference?: string | null
          triage_completed?: boolean | null
          tutorial_hints_seen?: Json | null
          tutorial_step?: number | null
          tutorial_version_completed?: string | null
          updated_at?: string | null
          username?: string | null
          water_glasses_goal?: number | null
          weekly_workout_goal?: number | null
          weekly_workouts?: number | null
          weight_goal?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          appetite_effect?: number | null
          application_day?: string | null
          application_frequency?: string | null
          application_interval_days?: number | null
          avg_sleep_hours?: number | null
          calories_goal?: number | null
          common_side_effects?: Json | null
          compulsion_effect?: number | null
          created_at?: string | null
          current_dose?: string | null
          current_weight?: number | null
          daily_water_ml?: number | null
          dietary_restrictions?: Json | null
          dose_history_completed?: boolean | null
          dose_increase_details?: string | null
          fiber_goal?: number | null
          first_login_at?: string | null
          goal?: string | null
          has_increased_dose?: boolean | null
          has_medical_guidance?: boolean | null
          health_conditions?: Json | null
          health_info_completed?: boolean | null
          height_cm?: number | null
          id?: string
          medical_specialty?: string | null
          medication?: string | null
          medications?: string | null
          mounjaro_start_date?: string | null
          name?: string | null
          next_dose_scheduled_at?: string | null
          preferred_application_time?: string | null
          protein_goal?: number | null
          push_permission_asked_at?: string | null
          routine_completed?: boolean | null
          satiety_effect?: number | null
          selected_plan?: string | null
          sex?: string | null
          side_effects_improvement?: string | null
          side_effects_worsening?: string | null
          subscription_seen?: boolean | null
          tracking_preference?: string | null
          triage_completed?: boolean | null
          tutorial_hints_seen?: Json | null
          tutorial_step?: number | null
          tutorial_version_completed?: string | null
          updated_at?: string | null
          username?: string | null
          water_glasses_goal?: number | null
          weekly_workout_goal?: number | null
          weekly_workouts?: number | null
          weight_goal?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          active: boolean
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptom_streaks: {
        Row: {
          checked_in: boolean
          created_at: string
          date: string
          id: string
          streak_count: number
          user_id: string
        }
        Insert: {
          checked_in?: boolean
          created_at?: string
          date: string
          id?: string
          streak_count?: number
          user_id: string
        }
        Update: {
          checked_in?: boolean
          created_at?: string
          date?: string
          id?: string
          streak_count?: number
          user_id?: string
        }
        Relationships: []
      }
      workout_suggestions: {
        Row: {
          context_note: string | null
          cooldown: string | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          focus_area: string | null
          id: string
          intensity: string | null
          main_workout: string | null
          tip: string | null
          user_id: string
          warmup: string | null
        }
        Insert: {
          context_note?: string | null
          cooldown?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          focus_area?: string | null
          id?: string
          intensity?: string | null
          main_workout?: string | null
          tip?: string | null
          user_id: string
          warmup?: string | null
        }
        Update: {
          context_note?: string | null
          cooldown?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          focus_area?: string | null
          id?: string
          intensity?: string | null
          main_workout?: string | null
          tip?: string | null
          user_id?: string
          warmup?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string | null
          date: string
          duration_minutes: number
          feeling_after: number | null
          id: string
          intensity: string
          notes: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          duration_minutes: number
          feeling_after?: number | null
          id?: string
          intensity?: string
          notes?: string | null
          user_id: string
          workout_type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_minutes?: number
          feeling_after?: number | null
          id?: string
          intensity?: string
          notes?: string | null
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      scheduled_dose_reminder_candidates: {
        Row: {
          dose: string | null
          last_dose_at: string | null
          medication: string | null
          scheduled_dose_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_missed_dose_schedules: { Args: never; Returns: number }
      compute_next_dose_scheduled_at: {
        Args: { _auto_advance?: boolean; _from?: string; _user_id: string }
        Returns: string
      }
      find_group_by_code: { Args: { _code: string }; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      next_preferred_dose_at: {
        Args: { _from?: string; _preferred_time: string }
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
