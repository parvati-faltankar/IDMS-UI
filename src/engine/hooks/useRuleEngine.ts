import { useState, useCallback } from 'react';
import type { RuleEngineRequest, RuleEngineResponse, RuleEngineFacts, RuleEngineContext } from '../types/ruleEngine';
import type { FieldPolicy } from '../types/configuration';
import { executeRuleSet as executeRuleSetApi } from '../api/ruleEngineApi';

export type RuleEngineState = {
  isLoading: boolean;
  response: RuleEngineResponse | null;
  /** API-level error (network / auth) — separate from business rule errors */
  apiError: string | null;
};

const EMPTY_RESPONSE: RuleEngineResponse = {
  isValid: true,
  hasErrors: false,
  errors: [],
  warnings: [],
  derivedValues: [],
  approvalRequired: false,
  approvalRequests: [],
  uiActions: [],
  dataSourceFilters: [],
};

/**
 * Generic rule engine hook — entity-agnostic.
 *
 * Usage:
 *   const { execute, state, fieldPolicies } = useRuleEngine();
 *   await execute('SO_PARTY_RULES', facts, context);
 */
export function useRuleEngine() {
  const [state, setState] = useState<RuleEngineState>({
    isLoading: false,
    response: null,
    apiError: null,
  });

  /** Derived field policies from the latest uiActions response */
  const [fieldPolicies, setFieldPolicies] = useState<Record<string, FieldPolicy>>({});

  const execute = useCallback(
    async (
      ruleSetCode: string,
      facts: RuleEngineFacts,
      context: RuleEngineContext
    ): Promise<RuleEngineResponse> => {
      setState({ isLoading: true, response: null, apiError: null });

      const request: RuleEngineRequest = { ruleSetCode, facts, context };
      const result = await executeRuleSetApi(request);

      if (!result.success) {
        const errorMsg = result.errors[0]?.message ?? 'Rule engine call failed.';
        setState({ isLoading: false, response: EMPTY_RESPONSE, apiError: errorMsg });
        return EMPTY_RESPONSE;
      }

      const ruleResponse = result.data;
      setState({ isLoading: false, response: ruleResponse, apiError: null });

      // Materialise field policy map from uiActions
      const newPolicies: Record<string, FieldPolicy> = {};
      for (const action of ruleResponse.uiActions) {
        const existing = newPolicies[action.fieldCode] ?? {
          fieldCode: action.fieldCode,
          isReadonly: false,
          isHidden: false,
          isMandatory: false,
        };
        switch (action.actionType) {
          case 'SetReadonly':
            existing.isReadonly = true;
            break;
          case 'SetEditable':
            existing.isReadonly = false;
            break;
          case 'SetHidden':
            existing.isHidden = true;
            break;
          case 'SetVisible':
            existing.isHidden = false;
            break;
          case 'SetMandatory':
            existing.isMandatory = true;
            break;
          case 'SetOptional':
            existing.isMandatory = false;
            break;
        }
        newPolicies[action.fieldCode] = existing;
      }
      setFieldPolicies((prev) => ({ ...prev, ...newPolicies }));

      return ruleResponse;
    },
    []
  );

  const clearState = useCallback(() => {
    setState({ isLoading: false, response: null, apiError: null });
    setFieldPolicies({});
  }, []);

  return { execute, state, fieldPolicies, clearState };
}
