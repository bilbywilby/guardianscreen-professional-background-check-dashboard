export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type CheckStatus = 'Clear' | 'Hit' | 'Pending' | 'Error';
export interface BackgroundCheck {
  id: string;
  name: string; // This will be the raw name for creation, but maskedName should be preferred for display
  maskedName: string;
  dob: string; // YYYY-MM-DD
  ssn: string; // Last 4 digits
  status: CheckStatus;
  createdAt: number; // epoch millis
  completedAt?: number; // epoch millis
  resultData?: Record<string, any>;
  cacheKey?: string;
}
export interface GuardianScreenConfig {
  id: 'singleton';
  apiKey: string;
  credits: number;
  alertThreshold: number;
  retentionDays: number;
  mockMode: boolean;
  failureCount: number;
  lastFailure: number;
  trippedUntil: number;
}
export interface PaginatedResponse<T> {
  items: T[];
  next: string | null;
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}
export interface AuditEntry {
  id:string;
  timestamp: number;
  action: string;
  details: Record<string, any>;
  ip: string;
}
export interface CacheEntry {
  id: string;
  cacheKey: string;
  result: any;
  timestamp: number;
}