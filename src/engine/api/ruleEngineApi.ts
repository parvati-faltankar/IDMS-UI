import type { RuleEngineRequest, RuleEngineResponse } from '../types/ruleEngine';
import type { ServiceResponse } from '../types/services';
import { enginePost } from './apiClient';

export async function executeRuleSet(
  request: RuleEngineRequest
): Promise<ServiceResponse<RuleEngineResponse>> {
  return enginePost<RuleEngineResponse>('/api/engine/rules/execute', request);
}
