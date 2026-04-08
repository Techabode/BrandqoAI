// types/dashboard.ts

export interface DashboardEntry {
  id: string;
  title: string;
  caption: string;
  platform: string;
  status: string;
  scheduledTime: string;
  brandName: string;
  errorMessage?: string | null;
}

export interface BrandSummary {
  brandName: string;
  industry?: string | null;
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  contentPillars?: string | null;
  approvalMode?: string | null;
  postingDaysPerWeek?: number | null;
  postsPerDay?: number | null;
}

export interface DashboardSummary {
  totalBrands: number;
  totalScheduledPosts: number;
  upcomingCount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  entries: DashboardEntry[];
  upcomingEntries: DashboardEntry[];
  brands: BrandSummary[];
}

export type DashboardSectionKey =
  | "overview"
  | "calendar"
  | "upcoming"
  | "brand-settings"
  | "social-accounts"
  | "brand-summary";
