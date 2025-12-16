import { IndexedEntity, Entity } from "./core-utils";
import type { BackgroundCheck, GuardianScreenConfig, CheckStatus, AuditEntry, CacheEntry } from "@shared/types";
import type { Env } from './core-utils';
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
    static readonly initialState: CacheEntry = { id: "", cacheKey: "", result: {}, timestamp: 0 };
    static override keyOf(state: CacheEntry): string { return state.cacheKey; }
    static async getCache(env: Env, cacheKey: string): Promise<CacheEntry | null> {
        const cache = new CacheEntity(env, cacheKey);
        if (await cache.exists()) {
            const state = await cache.getState();
            // Ensure id is consistent with the key for IndexedEntity
            if (state.id !== state.cacheKey) {
                state.id = state.cacheKey;
                await cache.save(state);
            }
            return state;
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
// --- Deep Search Mock Sources ---
const criminalMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 400 + Math.random() * 300));
    if (Math.random() < 0.4) { // 40% hit rate
        return { source: 'criminal', identityMatch: true, offenses: [{ level: 'Felony', date: '2021-08-15', location: 'Springfield, USA', details: 'Case #CR-2021-12345. Unauthorized distribution of donuts.', source: 'criminal' }] };
    }
    return { source: 'criminal', identityMatch: true, offenses: [] };
};
const nsopwMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 600 + Math.random() * 400));
    if (Math.random() < 0.15) { // 15% hit rate
        return { source: 'nsopw', identityMatch: true, offenses: [{ level: 'Sex Offense', date: '2018-05-10', location: 'Capital City, USA', details: 'Registry ID #NS-98765. Failure to register.', source: 'nsopw' }] };
    }
    return { source: 'nsopw', identityMatch: true, offenses: [] };
};
const ofacMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 300 + Math.random() * 200));
    if (Math.random() < 0.05) { // 5% hit rate
        return { source: 'ofac', identityMatch: true, offenses: [{ level: 'Sanction', date: '2022-01-20', location: 'International', details: 'Specially Designated National (SDN) List match.', source: 'ofac' }] };
    }
    return { source: 'ofac', identityMatch: false, offenses: [] };
};
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
  await new Promise(resolve => setTimeout(resolve, 200));
  if (config.mockMode) {
    // Original single-source mock for basic mode
    const random = Math.random();
    let result: { status: CheckStatus, resultData: Record<string, any> };
    if (random < 0.1) {
      result = { status: 'Error', resultData: { error: 'External API unreachable' } };
      await configEntity.recordFailure();
    } else if (random < 0.4) {
      result = { status: 'Hit', resultData: { riskScore: 78, identity: { match: true, confidence: 95 }, offenses: [{ level: 'Felony', date: '2021-08-15', location: 'Springfield, USA', details: 'Case #CR-2021-12345. Unauthorized distribution of donuts.', source: 'criminal' }], sources: ['criminal'] } };
    } else {
      result = { status: 'Clear', resultData: { riskScore: 12, identity: { match: true, confidence: 99 }, offenses: [], sources: ['criminal'] } };
    }
    if (check.cacheKey && result.status !== 'Error') {
        await CacheEntity.create(env, { id: check.cacheKey, cacheKey: check.cacheKey, result, timestamp: Date.now() });
    }
    return result;
  }
  // Deep Search multi-source mock
  const sources = [criminalMock(check), nsopwMock(check), ofacMock(check)];
  const results = await Promise.allSettled(sources);
  const successfulResults = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<any>).value);
  const failedSources = results.length - successfulResults.length;
  if (failedSources === sources.length) {
    await configEntity.recordFailure();
    return { status: 'Error', resultData: { error: 'All external data sources failed.' } };
  }
  const allOffenses = successfulResults.flatMap(r => r.offenses);
  const uniqueOffenses = Array.from(new Map(allOffenses.map(o => [`${o.date}-${o.location}`, o])).values());
  const hitSources = successfulResults.filter(r => r.identityMatch && r.offenses.length > 0);
  const hitSourceNames = hitSources.map(r => r.source);
  const baseRiskScore = 10 + uniqueOffenses.length * 25;
  const riskMultiplier = 1 + (hitSources.length > 1 ? (hitSources.length - 1) * 0.20 : 0);
  const finalRiskScore = Math.min(100, Math.round(baseRiskScore * riskMultiplier));
  const finalStatus: CheckStatus = uniqueOffenses.length > 0 ? 'Hit' : 'Clear';
  const result = {
    status: finalStatus,
    resultData: {
      riskScore: finalRiskScore,
      identity: { match: true, confidence: 98 },
      offenses: uniqueOffenses,
      sources: successfulResults.map(r => r.source),
    }
  };
  if (check.cacheKey) {
      await CacheEntity.create(env, { id: check.cacheKey, cacheKey: check.cacheKey, result, timestamp: Date.now() });
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