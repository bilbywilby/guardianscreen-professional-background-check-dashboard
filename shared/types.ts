export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type CheckStatus = 'Clear' | 'Hit' | 'Pending' | 'Error';
export interface BackgroundCheck {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  ssn: string; // Last 4 digits
  status: CheckStatus;
  createdAt: number; // epoch millis
  completedAt?: number; // epoch millis
  resultData?: Record<string, any>;
}
export interface GuardianScreenConfig {
  id: 'singleton';
  apiKey: string;
  credits: number;
  alertThreshold: number;
  retentionDays: number;
}
export interface PaginatedResponse<T> {
  items: T[];
  next: string | null;
}