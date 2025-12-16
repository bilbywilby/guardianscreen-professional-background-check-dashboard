import { IndexedEntity, Entity } from "./core-utils";
import type { BackgroundCheck, GuardianScreenConfig, CheckStatus } from "@shared/types";
// CHECK ENTITY: one DO instance per background check
export class CheckEntity extends IndexedEntity<BackgroundCheck> {
  static readonly entityName = "check";
  static readonly indexName = "checks";
  static readonly initialState: BackgroundCheck = { 
    id: "", 
    name: "", 
    dob: "", 
    ssn: "", 
    status: "Pending", 
    createdAt: 0 
  };
}
// CONFIG ENTITY: a singleton DO instance for global app settings
export class ConfigEntity extends Entity<GuardianScreenConfig> {
  static readonly entityName = "config";
  static readonly initialState: GuardianScreenConfig = {
    id: 'singleton',
    apiKey: '',
    credits: 100, // Default credits
    alertThreshold: 10,
    retentionDays: 30,
  };
  constructor(env: Env) {
    super(env, 'singleton'); // Always use the same ID for a singleton
  }
  async deductCredit(): Promise<boolean> {
    let success = false;
    await this.mutate(s => {
      if (s.credits > 0) {
        success = true;
        return { ...s, credits: s.credits - 1 };
      }
      return s;
    });
    return success;
  }
}
// Mock external API call
export async function runMockCheck(): Promise<{ status: CheckStatus, resultData: Record<string, any> }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
  const random = Math.random();
  if (random < 0.1) { // 10% chance of error
    return { status: 'Error', resultData: { error: 'External API unreachable' } };
  }
  if (random < 0.4) { // 30% chance of a hit
    return {
      status: 'Hit',
      resultData: {
        offense: 'Felony',
        date: '2021-08-15',
        location: 'Springfield, USA',
        details: 'Case #CR-2021-12345. Conviction for unauthorized distribution of donuts.'
      }
    };
  }
  // 60% chance of clear
  return { status: 'Clear', resultData: { message: 'No records found.' } };
}