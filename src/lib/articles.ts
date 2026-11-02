import type { ArticleCategory } from "@/types/database";

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  glycemia: "Glycémie",
  tea_therapy: "Thérapie par le thé",
  low_gi_recipes: "Recettes IG bas",
  physical_activity: "Activité physique",
  nutrition: "Nutrition",
  cardiovascular: "Santé cardiovasculaire",
};

export const CATEGORY_ICONS: Record<ArticleCategory, string> = {
  glycemia: "bloodtype",
  tea_therapy: "local_cafe",
  low_gi_recipes: "menu_book",
  physical_activity: "directions_walk",
  nutrition: "restaurant",
  cardiovascular: "favorite",
};

export const CATEGORY_STYLES: Record<ArticleCategory, string> = {
  glycemia: "bg-primary-fixed text-on-primary-fixed-variant",
  tea_therapy: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  low_gi_recipes: "bg-secondary-fixed text-on-secondary-fixed-variant",
  physical_activity: "bg-primary-fixed text-on-primary-fixed-variant",
  nutrition: "bg-surface-container-highest text-on-surface-variant",
  cardiovascular: "bg-error-container text-on-error-container",
};

export const CATEGORY_ORDER: ArticleCategory[] = [
  "glycemia",
  "tea_therapy",
  "low_gi_recipes",
  "physical_activity",
  "nutrition",
  "cardiovascular",
];
