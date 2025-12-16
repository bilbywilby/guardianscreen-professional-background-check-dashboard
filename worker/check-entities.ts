import { IndexedEntity, Entity } from "./core-utils";
import type { BackgroundCheck, GuardianScreenConfig, CheckStatus, AuditEntry, CacheEntry } from "@shared/types";
import type { Env } from './core-utils';
// Web Crypto HMAC-SHA256 utility
async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}
// CHECK ENTITY: one DO instance per background check
export class CheckEntity extends IndexedEntity<BackgroundCheck> {
  static readonly entityName = "check";
  static readonly indexName = "checks";
  static readonly initialState: BackgroundCheck = {
    id: "",
    name: "",
    maskedName: "",
    dob: "",
    ssn: "",
    status: "Pending",
    createdAt: 0
  };
}
// CACHE ENTITY: one DO instance per cached result
export class CacheEntity extends IndexedEntity<CacheEntry> {
    static readonly entityName = "cache";
    static readonly indexName = "caches";
    static readonly initialState: CacheEntry = { cacheKey: "", result: {}, timestamp: 0 };
    static keyOf(state: CacheEntry): string { return state.cacheKey; }
    static async getCache(env: Env, cacheKey: string): Promise<CacheEntry | null> {
        const cache = new CacheEntity(env, cacheKey);
        if (await cache.exists()) {
            return cache.getState();
        }
        return null;
    }
    static isCacheValid(cacheEntry: CacheEntry | null, ttlSeconds: number = 86400): boolean { // 24 hours
        if (!cacheEntry) return false;
        return (Date.now() - cacheEntry.timestamp) / 1000 < ttlSeconds;
    }
}
// CONFIG ENTITY: a singleton DO instance for global app settings
export class ConfigEntity extends Entity<GuardianScreenConfig> {
  static readonly entityName = "config";
  static readonly initialState: GuardianScreenConfig = {
    id: 'singleton',
    apiKey: '',
    credits: 100,
    alertThreshold: 10,
    retentionDays: 30,
    mockMode: true,
    failureCount: 0,
    lastFailure: 0,
    trippedUntil: 0,
  };
  constructor(env: Env) {
    super(env, 'singleton');
  }
  async deductCredit(): Promise<{ success: boolean; reason?: string }> {
    let result: { success: boolean; reason?: string } = { success: false };
    await this.mutate(s => {
      if (s.trippedUntil > Date.now()) {
        result = { success: false, reason: 'Circuit breaker is active. Please try again later.' };
        return s;
      }
      if (s.credits > 0) {
        result = { success: true };
        return { ...s, credits: s.credits - 1 };
      }
      result = { success: false, reason: 'Insufficient credits.' };
      return s;
    });
    return result;
  }
  async recordFailure(): Promise<void> {
    await this.mutate(s => {
        const now = Date.now();
        const failuresInWindow = (now - s.lastFailure < 60000) ? s.failureCount + 1 : 1;
        const newState = { ...s, failureCount: failuresInWindow, lastFailure: now };
        if (failuresInWindow >= 5) {
            newState.trippedUntil = now + 60000; // Trip for 60 seconds
        }
        return newState;
    });
  }
}
export class AuditEntity extends IndexedEntity<AuditEntry> {
  static readonly entityName = "audit";
  static readonly indexName = "audits";
  static readonly initialState: AuditEntry = {
    id: "",
    timestamp: 0,
    action: "",
    details: {},
    ip: "N/A",
  };
}
// Mock external API call with caching and circuit breaker logic
export async function runMockCheck(env: Env, check: BackgroundCheck): Promise<{ status: CheckStatus, resultData: Record<string, any> }> {
  const configEntity = new ConfigEntity(env);
  const config = await configEntity.getState();
  if (check.cacheKey) {
      const cached = await CacheEntity.getCache(env, check.cacheKey);
      if (CacheEntity.isCacheValid(cached)) {
          return cached!.result;
      }
  }
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  if (!config.mockMode) {
      await configEntity.recordFailure();
      return { status: 'Error', resultData: { error: 'External API call failed (real mode simulation).' } };
  }
  const random = Math.random();
  let result: { status: CheckStatus, resultData: Record<string, any> };
  if (random < 0.1) {
    result = { status: 'Error', resultData: { error: 'External API unreachable' } };
    await configEntity.recordFailure();
  } else if (random < 0.4) {
    result = {
      status: 'Hit',
      resultData: {
        riskScore: 78,
        identity: { match: true, confidence: 95 },
        offenses: [
            { level: 'Felony', date: '2021-08-15', location: 'Springfield, USA', details: 'Case #CR-2021-12345. Unauthorized distribution of donuts.' },
            { level: 'Misdemeanor', date: '2019-03-22', location: 'Shelbyville, USA', details: 'Case #MS-2019-67890. Jaywalking with intent to loiter.' }
        ]
      }
    };
  } else {
    result = { status: 'Clear', resultData: { riskScore: 12, identity: { match: true, confidence: 99 }, offenses: [] } };
  }
  if (check.cacheKey && result.status !== 'Error') {
      await CacheEntity.create(env, { cacheKey: check.cacheKey, result, timestamp: Date.now() });
  }
  return result;
}
export async function logAudit(env: Env, ip: string, action: string, details: Record<string, any>): Promise<void> {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action,
    details,
    ip,
  };
  await AuditEntity.create(env, entry);
}