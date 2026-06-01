import {
  getRuleSets as getRuleSetsApi,
  saveRuleSet as saveRuleSetApi,
  deleteRuleSet as deleteRuleSetApi,
} from '../../../../../engine/api/configurationApi';
import type { RuleSetConfig } from '../../../../../engine/types/configuration';
import { SALE_ORDER_RULE_SET_SEED } from '../../../../../engine/seed/ruleSets';

export type { RuleSetConfig };

export interface EngineConfigResult<T> {
  data: T;
  isOffline: boolean;
}

export async function loadRuleSets(entityName?: string): Promise<EngineConfigResult<RuleSetConfig[]>> {
  const result = await getRuleSetsApi(entityName);
  if (result.success) return { data: result.data, isOffline: false };
  const seed = entityName
    ? SALE_ORDER_RULE_SET_SEED.filter((r) => r.entityName === entityName)
    : SALE_ORDER_RULE_SET_SEED;
  return { data: seed, isOffline: true };
}

export async function persistRuleSet(ruleSet: RuleSetConfig): Promise<EngineConfigResult<RuleSetConfig>> {
  const result = await saveRuleSetApi(ruleSet);
  if (result.success) return { data: result.data, isOffline: false };
  return { data: ruleSet, isOffline: true };
}

export async function removeRuleSet(ruleSetCode: string): Promise<EngineConfigResult<boolean>> {
  const result = await deleteRuleSetApi(ruleSetCode);
  return { data: result.success, isOffline: !result.success };
}
