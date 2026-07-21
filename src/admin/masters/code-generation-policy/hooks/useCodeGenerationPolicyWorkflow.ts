import { Eye, FileCode2, Hash, Info, type LucideIcon, Tag } from 'lucide-react';
import { Edit2 } from 'lucide-react';
import { useMemo } from 'react';

type PolicyStepId = 'basic' | 'applicability' | 'prefix' | 'series' | 'format' | 'history';

type PolicyWorkflowForm = {
  applicableFor: string;
  caseFormat: string;
  displayName: string;
  entity: string;
  module: string;
  numberLength: string;
  paddingCharacter: string;
  policyName: string;
  prefixId: string;
  separator: string;
  seriesType: string;
  startingNumber: string;
};

export interface CodeGenerationPolicyStepItem {
  id: PolicyStepId;
  icon: LucideIcon;
  label: string;
  state: 'default' | 'current' | 'complete';
}

const STEP_CONFIG: Array<{ id: PolicyStepId; icon: LucideIcon; label: string }> = [
  { id: 'basic', icon: FileCode2, label: 'Basic Details' },
  { id: 'applicability', icon: Tag, label: 'Applicability' },
  { id: 'prefix', icon: Hash, label: 'Prefix Selection' },
  { id: 'series', icon: Edit2, label: 'Series & Pattern' },
  { id: 'format', icon: Info, label: 'Number Format' },
  { id: 'history', icon: Eye, label: 'Usage & History' },
];

function isStepComplete(stepId: PolicyStepId, form: PolicyWorkflowForm) {
  if (stepId === 'basic') {
    return Boolean(form.policyName && form.displayName);
  }
  if (stepId === 'applicability') {
    return Boolean(form.applicableFor && form.module && form.entity);
  }
  if (stepId === 'prefix') {
    return Boolean(form.prefixId);
  }
  if (stepId === 'series') {
    return Boolean(form.seriesType);
  }
  if (stepId === 'format') {
    return Boolean(
      form.numberLength &&
      form.startingNumber &&
      form.paddingCharacter &&
      form.separator &&
      form.caseFormat
    );
  }
  return false;
}

export function useCodeGenerationPolicyWorkflow({
  activeStepId,
  form,
}: {
  activeStepId: PolicyStepId;
  form: PolicyWorkflowForm;
}) {
  const steps = useMemo<CodeGenerationPolicyStepItem[]>(() => {
    return STEP_CONFIG.map((step) => {
      const complete = isStepComplete(step.id, form);
      return {
        ...step,
        state: activeStepId === step.id ? 'current' : complete ? 'complete' : 'default',
      };
    });
  }, [activeStepId, form]);

  return {
    stepOrder: STEP_CONFIG.map((step) => step.id),
    steps,
  };
}
