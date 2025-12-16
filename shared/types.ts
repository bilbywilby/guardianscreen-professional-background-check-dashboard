import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, ShieldAlert, AlertOctagon, Users, Activity, Globe, Flag, MessageCircle } from 'lucide-react';
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
export const sourceConfig: Record<string, SourceInfo> = {
  criminal: { icon: ShieldCheck, label: 'Criminal Database', color: 'text-blue-500' },
  nsopw: { icon: ShieldAlert, label: 'Sex Offender Registry (NSOPW)', color: 'text-red-500' },
  ofac: { icon: AlertOctagon, label: 'OFAC Sanctions', color: 'text-orange-500' },
  dmf: { icon: Users, label: 'DMF Death Records', color: 'text-indigo-500' },
  oig: { icon: Activity, label: 'OIG LEIE Exclusions', color: 'text-green-500' },
  uk: { icon: Globe, label: 'UK Sanctions', color: 'text-purple-500' },
  eun: { icon: Flag, label: 'EU/UN Sanctions', color: 'text-gray-500' },
  reputational: { icon: MessageCircle, label: 'Reputational Risk (NLP Scan)', color: 'text-pink-500' },
};