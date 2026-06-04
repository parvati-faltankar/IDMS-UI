import {
  getRuleSets as getRuleSetsApi,
  saveRuleSet as saveRuleSetApi,
  deleteRuleSet as deleteRuleSetApi,
} from '../../../../../engine/api/configurationApi';
import type { RuleSetConfig } from '../../../../../engine/types/configuration';
import { SALE_ORDER_RULE_SET_SEED } from '../../../../../engine/seed/ruleSets';
import { ruleSetStorage } from '../../../../../engine/storage/engineConfigStorage';

export type { RuleSetConfig };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

/** Load: API → localStorage overrides on top of seed → seed fallback */
export async function loadRuleSets(entityName?: string): Promise<EngineConfigResult<RuleSetConfig[]>> {
  const result = await getRuleSetsApi(entityName);
  if (result.success) return { data: result.data, isOffline: false };

  // Merge seed with any locally saved overrides
  const seed: RuleSetConfig[] = entityName
    ? SALE_ORDER_RULE_SET_SEED.filter((r) => r.entityName === entityName)
    : [...SALE_ORDER_RULE_SET_SEED];

  const local = ruleSetStorage.load<RuleSetConfig>();
  if (local.length > 0) {
    // Overwrite seed entries with local edits; append new local-only entries
    const merged = seed.map((s) => local.find((l) => l.ruleSetCode === s.ruleSetCode) ?? s);
    const newEntries = local.filter((l) => !seed.some((s) => s.ruleSetCode === l.ruleSetCode));
    return { data: [...merged, ...newEntries], isOffline: true };
  }

  return { data: seed, isOffline: true };
}

export async function persistRuleSet(ruleSet: RuleSetConfig): Promise<EngineConfigResult<RuleSetConfig>> {
  const result = await saveRuleSetApi(ruleSet);
  if (result.success) {
    // Keep localStorage in sync with server
    ruleSetStorage.save<RuleSetConfig>(ruleSet);
    return { data: result.data, isOffline: false };
  }
  // Save locally so the change survives page refresh
  ruleSetStorage.save<RuleSetConfig>(ruleSet);
  return { data: ruleSet, isOffline: true };
}

export async function removeRuleSet(ruleSetCode: string): Promise<EngineConfigResult<boolean>> {
  const result = await deleteRuleSetApi(ruleSetCode);
  // Remove from localStorage regardless (cleanup)
  ruleSetStorage.remove<RuleSetConfig>(ruleSetCode);
  return { data: result.success, isOffline: !result.success };
}
