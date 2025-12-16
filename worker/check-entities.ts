import { IndexedEntity, Entity } from "./core-utils";
import type { BackgroundCheck, GuardianScreenConfig, CheckStatus, AuditEntry, CacheEntry } from "@shared/types";
import { sourceConfig } from "@shared/types";
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
    static override keyOf(state: { id: string }): string {
        return (state as CacheEntry).cacheKey;
    }
    static async getCache(env: Env, cacheKey: string): Promise<CacheEntry | null> {
        const cache = new CacheEntity(env, cacheKey);
        if (await cache.exists()) {
            const state = await cache.getState();
            if (state.id !== state.cacheKey) {
                const updatedState = { ...state, id: state.cacheKey };
                await cache.save(updatedState);
                return updatedState;
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
const getDobYear = (dob: string) => parseInt(dob.split('-')[0], 10);
const criminalMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 400 + Math.random() * 300));
    if (Math.random() < 0.4) {
        return { source: 'criminal', pillar: 'criminal', identityMatch: true, offenses: [{ level: 'Felony', date: '2021-08-15', location: 'Springfield, USA', details: 'Case #CR-2021-12345. Unauthorized distribution of donuts.', source: 'criminal', pillar: 'criminal' }] };
    }
    return { source: 'criminal', pillar: 'criminal', identityMatch: true, offenses: [] };
};
const nsopwMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 600 + Math.random() * 400));
    if (Math.random() < 0.15) {
        return { source: 'nsopw', pillar: 'criminal', identityMatch: true, offenses: [{ level: 'Sex Offense', date: '2018-05-10', location: 'Capital City, USA', details: 'Registry ID #NS-98765. Failure to register.', source: 'nsopw', pillar: 'criminal' }] };
    }
    return { source: 'nsopw', pillar: 'criminal', identityMatch: true, offenses: [] };
};
const ofacMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 300 + Math.random() * 200));
    if (Math.random() < 0.05) {
        return { source: 'ofac', pillar: 'sanctions', identityMatch: true, offenses: [{ level: 'Sanction', date: '2022-01-20', location: 'International', details: 'Specially Designated National (SDN) List match.', source: 'ofac', pillar: 'sanctions' }] };
    }
    return { source: 'ofac', pillar: 'sanctions', identityMatch: false, offenses: [] };
};
const dmfMock = async (check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 250 + Math.random() * 200));
    const dobYear = getDobYear(check.dob);
    const isOldEnough = (new Date().getFullYear() - dobYear) > 50;
    if (isOldEnough && Math.random() < 0.05) {
        const deathYear = dobYear + 65 + Math.floor(Math.random() * 15);
        return { source: 'dmf', pillar: 'identity', identityMatch: true, offenses: [{ level: 'Deceased', date: `${deathYear}-03-22`, location: 'Social Security Administration', details: 'Match found in Death Master File.', source: 'dmf', pillar: 'identity' }] };
    }
    return { source: 'dmf', pillar: 'identity', identityMatch: true, offenses: [] };
};
const oigMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 350 + Math.random() * 250));
    if (Math.random() < 0.08) {
        return { source: 'oig', pillar: 'health', identityMatch: true, offenses: [{ level: 'Exclusion', date: '2020-11-01', location: 'HHS/OIG', details: 'Excluded from federal healthcare programs.', source: 'oig', pillar: 'health' }] };
    }
    return { source: 'oig', pillar: 'health', identityMatch: true, offenses: [] };
};
const ukMock = async (check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 500 + Math.random() * 300));
    const dobYear = getDobYear(check.dob);
    const mockHitYear = 1975;
    if (Math.abs(dobYear - mockHitYear) <= 3 && Math.random() < 0.03) {
        return { source: 'uk', pillar: 'sanctions', identityMatch: true, offenses: [{ level: 'Sanction', date: '2019-07-18', location: 'United Kingdom', details: 'Match on UK sanctions list.', source: 'uk', pillar: 'sanctions' }] };
    }
    return { source: 'uk', pillar: 'sanctions', identityMatch: true, offenses: [] };
};
const euUnMock = async (_check: BackgroundCheck) => {
    await new Promise(res => setTimeout(res, 550 + Math.random() * 350));
    if (Math.random() < 0.04) {
        return { source: 'eun', pillar: 'sanctions', identityMatch: true, offenses: [{ level: 'Sanction', date: '2021-02-25', location: 'EU/UN', details: 'Consolidated EU/UN sanctions list match.', source: 'eun', pillar: 'sanctions' }] };
    }
    return { source: 'eun', pillar: 'sanctions', identityMatch: true, offenses: [] };
};
export async function runMockCheck(env: Env, check: BackgroundCheck): Promise<{ status: CheckStatus, resultData: Record<string, any> }> {
  const configEntity = new ConfigEntity(env);
  const config = await configEntity.getState();
  if (check.cacheKey) {
      const cached = await CacheEntity.getCache(env, check.cacheKey);
      if (CacheEntity.isCacheValid(cached)) {
          return cached!.result;
      }
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  if (config.mockMode) {
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
  const sources = [criminalMock(check), nsopwMock(check), ofacMock(check), dmfMock(check), oigMock(check), ukMock(check), euUnMock(check)];
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
  const uniquePillars = new Set(hitSources.map(r => r.pillar));
  const baseRiskScore = 10 + uniqueOffenses.length * 25;
  const riskMultiplier = 1 + (uniquePillars.size > 1 ? (uniquePillars.size - 1) * 0.15 : 0);
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