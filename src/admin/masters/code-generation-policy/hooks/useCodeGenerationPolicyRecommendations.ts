import { useMemo } from 'react';

export type CodeGenerationPolicyRecommendationAction =
  | 'complete-basic'
  | 'complete-applicability'
  | 'pick-prefix'
  | 'configure-series'
  | 'configure-format'
  | 'review-history'
  | 'save-draft'
  | 'activate';

interface PolicyLikeForm {
  applicableFor: string;
  module: string;
  entity: string;
  prefixId: string;
  seriesType: string;
  numberLength: string;
  startingNumber: string;
  policyName: string;
  displayName: string;
  status: string;
}

export interface CodeGenerationPolicyRecommendation {
  action: CodeGenerationPolicyRecommendationAction;
  description: string;
  label: string;
  shortcut?: string;
}

export function useCodeGenerationPolicyRecommendations({
  activeStepId,
  form,
  isDraft,
}: {
  activeStepId: string;
  form: PolicyLikeForm;
  isDraft: boolean;
}) {
  return useMemo<CodeGenerationPolicyRecommendation>(() => {
    if (!form.policyName || !form.displayName) {
      return {
        action: 'complete-basic',
        description: 'Finish the policy identity first so the rest of the configuration has a clear business meaning.',
        label: 'Complete basic details',
      };
    }

    if (!form.applicableFor || !form.module || !form.entity) {
      return {
        action: 'complete-applicability',
        description: 'Define applicability next so matching prefixes and entity rules can narrow automatically.',
        label: 'Complete applicability',
      };
    }

    if (!form.prefixId) {
      return {
        action: 'pick-prefix',
        description: 'Choose the active prefix for this entity scope to unlock a stable code preview.',
        label: 'Pick a matching prefix',
      };
    }

    if (!form.seriesType) {
      return {
        action: 'configure-series',
        description: 'Select the series behavior to decide whether the code runs continuously or resets by time basis.',
        label: 'Configure series pattern',
      };
    }

    if (!form.numberLength || !form.startingNumber) {
      return {
        action: 'configure-format',
        description: 'Set the sequence length and starting number to complete the generation format.',
        label: 'Complete number format',
      };
    }

    if (activeStepId === 'history') {
      return {
        action: 'review-history',
        description: 'Review usage and deactivation signals before you finalize the policy state.',
        label: 'Review usage history',
      };
    }

    if (isDraft || form.status === 'Draft') {
      return {
        action: 'activate',
        description: 'The required policy inputs are in place. Activate when you are ready to make this policy live.',
        label: 'Activate policy',
        shortcut: 'A',
      };
    }

    return {
      action: 'save-draft',
      description: 'Save the current configuration changes and keep the policy aligned with the latest business rule updates.',
      label: 'Save changes',
      shortcut: 'A',
    };
  }, [activeStepId, form, isDraft]);
}
