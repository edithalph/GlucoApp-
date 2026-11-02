/**
 * Types de la base GlucoApp — GÉNÉRÉS, ne pas éditer à la main.
 *
 * Régénération :
 *   npx supabase gen types typescript --project-id dtaojjlotgwjrdcpvuhs > src/types/database.ts
 * (puis recoller le bloc d'alias en fin de fichier)
 *
 * Les `Relationships` décrivent les clés étrangères : sans elles, les jointures
 * imbriquées de PostgREST (`meals(meal_items(foods(...)))`) se résolvent en
 * `never` côté TypeScript.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      favorite_meals: {
        Row: { created_at: string; meal_id: string; user_id: string };
        Insert: { created_at?: string; meal_id: string; user_id: string };
        Update: { created_at?: string; meal_id?: string; user_id?: string };
        Relationships: [
          { foreignKeyName: "favorite_meals_meal_id_fkey"; columns: ["meal_id"]; isOneToOne: false; referencedRelation: "meals"; referencedColumns: ["id"] },
          { foreignKeyName: "favorite_meals_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      article_bookmarks: {
        Row: { article_id: string; created_at: string; user_id: string };
        Insert: { article_id: string; created_at?: string; user_id: string };
        Update: { article_id?: string; created_at?: string; user_id?: string };
        Relationships: [
          {
            foreignKeyName: "article_bookmarks_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          category: Database["public"]["Enums"]["article_category"];
          content_md: string;
          cover_url: string | null;
          excerpt: string | null;
          id: string;
          is_dietitian_validated: boolean;
          published_at: string;
          read_minutes: number;
          slug: string;
          title: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["article_category"];
          content_md: string;
          cover_url?: string | null;
          excerpt?: string | null;
          id?: string;
          is_dietitian_validated?: boolean;
          published_at?: string;
          read_minutes?: number;
          slug: string;
          title: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["article_category"];
          content_md?: string;
          cover_url?: string | null;
          excerpt?: string | null;
          id?: string;
          is_dietitian_validated?: boolean;
          published_at?: string;
          read_minutes?: number;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
      foods: {
        Row: {
          carbs_per_100g: number;
          category: string | null;
          created_at: string;
          fat_per_100g: number;
          fiber_per_100g: number;
          glycemic_index: number | null;
          id: string;
          is_verified: boolean;
          kcal_per_100g: number;
          name: string;
          protein_per_100g: number;
        };
        Insert: {
          carbs_per_100g?: number;
          category?: string | null;
          created_at?: string;
          fat_per_100g?: number;
          fiber_per_100g?: number;
          glycemic_index?: number | null;
          id?: string;
          is_verified?: boolean;
          kcal_per_100g?: number;
          name: string;
          protein_per_100g?: number;
        };
        Update: {
          carbs_per_100g?: number;
          category?: string | null;
          created_at?: string;
          fat_per_100g?: number;
          fiber_per_100g?: number;
          glycemic_index?: number | null;
          id?: string;
          is_verified?: boolean;
          kcal_per_100g?: number;
          name?: string;
          protein_per_100g?: number;
        };
        Relationships: [];
      };
      glucose_readings: {
        Row: {
          activity_minutes: number | null;
          context: Database["public"]["Enums"]["reading_context"];
          created_at: string;
          id: string;
          meal_id: string | null;
          measured_at: string;
          medication_taken: boolean | null;
          note: string | null;
          sleep_hours: number | null;
          stress_level: number | null;
          symptoms: string | null;
          user_id: string;
          value_mgdl: number;
        };
        Insert: {
          activity_minutes?: number | null;
          context?: Database["public"]["Enums"]["reading_context"];
          created_at?: string;
          id?: string;
          meal_id?: string | null;
          measured_at?: string;
          medication_taken?: boolean | null;
          note?: string | null;
          sleep_hours?: number | null;
          stress_level?: number | null;
          symptoms?: string | null;
          user_id: string;
          value_mgdl: number;
        };
        Update: {
          activity_minutes?: number | null;
          context?: Database["public"]["Enums"]["reading_context"];
          created_at?: string;
          id?: string;
          meal_id?: string | null;
          measured_at?: string;
          medication_taken?: boolean | null;
          note?: string | null;
          sleep_hours?: number | null;
          stress_level?: number | null;
          symptoms?: string | null;
          user_id?: string;
          value_mgdl?: number;
        };
        Relationships: [
          {
            foreignKeyName: "glucose_readings_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "glucose_readings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_items: {
        Row: {
          created_at: string;
          food_id: string;
          id: string;
          meal_id: string;
          quantity_g: number;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          id?: string;
          meal_id: string;
          quantity_g: number;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          id?: string;
          meal_id?: string;
          quantity_g?: number;
        };
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_predictions: {
        Row: {
          baseline_mgdl: number;
          created_at: string;
          id: string;
          meal_id: string;
          predicted_peak_mgdl: number;
          predicted_peak_minutes: number;
          risk: Database["public"]["Enums"]["risk_level"];
        };
        Insert: {
          baseline_mgdl: number;
          created_at?: string;
          id?: string;
          meal_id: string;
          predicted_peak_mgdl: number;
          predicted_peak_minutes: number;
          risk: Database["public"]["Enums"]["risk_level"];
        };
        Update: {
          baseline_mgdl?: number;
          created_at?: string;
          id?: string;
          meal_id?: string;
          predicted_peak_mgdl?: number;
          predicted_peak_minutes?: number;
          risk?: Database["public"]["Enums"]["risk_level"];
        };
        Relationships: [
          {
            foreignKeyName: "meal_predictions_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
        ];
      };
      meals: {
        Row: {
          created_at: string;
          eaten_at: string;
          glycemic_load: number;
          id: string;
          name: string | null;
          total_carbs_g: number;
          total_kcal: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          eaten_at?: string;
          glycemic_load?: number;
          id?: string;
          name?: string | null;
          total_carbs_g?: number;
          total_kcal?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          eaten_at?: string;
          glycemic_load?: number;
          id?: string;
          name?: string | null;
          total_carbs_g?: number;
          total_kcal?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          condition: Database["public"]["Enums"]["medical_condition"] | null;
          created_at: string;
          first_name: string | null;
          height_cm: number | null;
          id: string;
          last_name: string | null;
          onboarding_completed: boolean;
          preferred_unit: Database["public"]["Enums"]["glucose_unit"];
          sex: Database["public"]["Enums"]["biological_sex"] | null;
          target_max_mgdl: number;
          target_min_mgdl: number;
          updated_at: string;
          weight_kg: number | null;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          condition?: Database["public"]["Enums"]["medical_condition"] | null;
          created_at?: string;
          first_name?: string | null;
          height_cm?: number | null;
          id: string;
          last_name?: string | null;
          onboarding_completed?: boolean;
          preferred_unit?: Database["public"]["Enums"]["glucose_unit"];
          sex?: Database["public"]["Enums"]["biological_sex"] | null;
          target_max_mgdl?: number;
          target_min_mgdl?: number;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          age?: number | null;
          avatar_url?: string | null;
          condition?: Database["public"]["Enums"]["medical_condition"] | null;
          created_at?: string;
          first_name?: string | null;
          height_cm?: number | null;
          id?: string;
          last_name?: string | null;
          onboarding_completed?: boolean;
          preferred_unit?: Database["public"]["Enums"]["glucose_unit"];
          sex?: Database["public"]["Enums"]["biological_sex"] | null;
          target_max_mgdl?: number;
          target_min_mgdl?: number;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          created_at: string;
          days_of_week: number[];
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["reminder_kind"];
          label: string;
          time_of_day: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          days_of_week?: number[];
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["reminder_kind"];
          label: string;
          time_of_day: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          days_of_week?: number[];
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["reminder_kind"];
          label?: string;
          time_of_day?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tea_measurements: {
        Row: {
          created_at: string;
          id: string;
          measured_at: string;
          offset_minutes: number;
          session_id: string;
          value_mgdl: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          measured_at?: string;
          offset_minutes: number;
          session_id: string;
          value_mgdl: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          measured_at?: string;
          offset_minutes?: number;
          session_id?: string;
          value_mgdl?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tea_measurements_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "tea_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tea_sessions: {
        Row: {
          baseline_mgdl: number | null;
          created_at: string;
          ended_at: string | null;
          id: string;
          note: string | null;
          started_at: string;
          status: Database["public"]["Enums"]["tea_session_status"];
          tea_id: string | null;
          tea_taken_at: string | null;
          user_id: string;
        };
        Insert: {
          baseline_mgdl?: number | null;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          note?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["tea_session_status"];
          tea_id?: string | null;
          tea_taken_at?: string | null;
          user_id: string;
        };
        Update: {
          baseline_mgdl?: number | null;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          note?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["tea_session_status"];
          tea_id?: string | null;
          tea_taken_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tea_sessions_tea_id_fkey";
            columns: ["tea_id"];
            isOneToOne: false;
            referencedRelation: "teas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tea_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teas: {
        Row: {
          created_at: string;
          description: string | null;
          expected_effect_pct: number | null;
          id: string;
          kind: Database["public"]["Enums"]["tea_kind"];
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expected_effect_pct?: number | null;
          id?: string;
          kind: Database["public"]["Enums"]["tea_kind"];
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expected_effect_pct?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["tea_kind"];
          name?: string;
        };
        Relationships: [];
      };
      weight_entries: {
        Row: {
          created_at: string;
          id: string;
          measured_at: string;
          user_id: string;
          weight_kg: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          measured_at?: string;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          measured_at?: string;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [
          {
            foreignKeyName: "weight_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      f_unaccent: { Args: { txt: string }; Returns: string };
      search_foods: {
        Args: { limite?: number; terme: string };
        Returns: {
          carbs_per_100g: number;
          category: string | null;
          created_at: string;
          fat_per_100g: number;
          fiber_per_100g: number;
          glycemic_index: number | null;
          id: string;
          is_verified: boolean;
          kcal_per_100g: number;
          name: string;
          protein_per_100g: number;
        }[];
        SetofOptions: {
          from: "*";
          to: "foods";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      article_category:
        | "glycemia"
        | "tea_therapy"
        | "low_gi_recipes"
        | "physical_activity"
        | "nutrition"
        | "cardiovascular";
      biological_sex: "male" | "female";
      glucose_unit: "g_l" | "mmol_l" | "mg_dl";
      medical_condition:
        | "type1"
        | "type2"
        | "prediabetic"
        | "prevention"
        | "other";
      reading_context:
        | "fasting"
        | "pre_meal"
        | "post_meal"
        | "pre_tea"
        | "post_tea"
        | "other";
      reminder_kind: "glucose" | "tea" | "meal" | "custom";
      risk_level: "low" | "moderate" | "high";
      tea_kind:
        | "green"
        | "black"
        | "oolong"
        | "herbal"
        | "matcha"
        | "white"
        | "other";
      tea_session_status: "active" | "completed" | "abandoned";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<
  Name extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][Name]["Row"];

export type TablesInsert<
  Name extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][Name]["Insert"];

export type TablesUpdate<
  Name extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][Name]["Update"];

export type Enums<Name extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][Name];

// ---------------------------------------------------------------------------
// Alias de confort — préservent les imports du code applicatif.
// ---------------------------------------------------------------------------
export type Profile = Tables<"profiles">;
export type GlucoseReading = Tables<"glucose_readings">;
export type WeightEntry = Tables<"weight_entries">;
export type Food = Tables<"foods">;
export type Meal = Tables<"meals">;
export type MealItem = Tables<"meal_items">;
export type MealPrediction = Tables<"meal_predictions">;
export type Tea = Tables<"teas">;
export type TeaSession = Tables<"tea_sessions">;
export type TeaMeasurement = Tables<"tea_measurements">;
export type Article = Tables<"articles">;
export type ArticleBookmark = Tables<"article_bookmarks">;
export type FavoriteMeal = Tables<"favorite_meals">;
export type Reminder = Tables<"reminders">;

export type BiologicalSex = Enums<"biological_sex">;
export type GlucoseUnitDb = Enums<"glucose_unit">;
export type MedicalCondition = Enums<"medical_condition">;
export type ReadingContext = Enums<"reading_context">;
export type RiskLevel = Enums<"risk_level">;
export type TeaKind = Enums<"tea_kind">;
export type TeaSessionStatus = Enums<"tea_session_status">;
export type ArticleCategory = Enums<"article_category">;
export type ReminderKind = Enums<"reminder_kind">;
