export const ACTIVITY_TYPES = [
  "Administration",
  "Deployment",
  "Business Development",
  "Merchant Visit",
  "Idle Recall",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Activity types for which terminal_count is operationally meaningful. */
export const TERMINAL_TYPES: readonly ActivityType[] = ["Deployment", "Idle Recall"];

export const STATUSES = ["Completed", "Pending"] as const;
export type Status = (typeof STATUSES)[number];

export interface ActivityLog {
  id: string;
  activity_date: string; // YYYY-MM-DD (local calendar date)
  activity_type: ActivityType;
  terminal_count: number; // integer >= 0
  merchant_name: string;
  merchant_location: string;
  customer_issues: string;
  action_taken: string;
  status: Status;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Fields the user actually types; the rest are generated. */
export type ActivityInput = Omit<ActivityLog, "id" | "created_at" | "updated_at">;

export interface Settings {
  officer_name: string;
  branch_name: string;
}

export const DEFAULT_SETTINGS: Settings = {
  officer_name: "Tinashe Mariridza",
  branch_name: "Digital",
};
