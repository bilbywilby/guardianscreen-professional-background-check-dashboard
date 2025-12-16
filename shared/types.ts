import type { LucideIcon } from 'lucide-react';
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type CheckStatus = 'Clear' | 'Hit' | 'Pending' | 'Error';
export interface Offense {
    level: string;
    date: string;
    location: string;
    details: string;
    source: string;
    pillar?: string;
}
export interface BackgroundCheck {
  id: string;
  name: string;
  maskedName: string;
  dob: string;
  ssn: string;
  status: CheckStatus;
  createdAt: number;
  completedAt?: number;
  resultData?: {
    riskScore?: number;
    identity?: { match: boolean; confidence: number };
    offenses?: Offense[];
    sources?: string[];
    error?: string;
  };
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
export interface SourceInfo {
    icon: LucideIcon;
    label: string;
    color: string;
}