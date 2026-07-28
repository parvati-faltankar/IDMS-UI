import type React from 'react';

export type MasterFormStepState = 'default' | 'current' | 'complete' | 'partial' | 'disabled';
export type MasterFormStepperMode = 'expanded' | 'collapsed' | 'drawer';

export type MasterFormStepItem = {
  id: string;
  label: string;
  description?: string;
  count?: number;
  disabled?: boolean;
  state?: MasterFormStepState;
  icon?: React.ReactNode;
  tooltipLabel?: string;
  tooltipTitle?: string;
  tooltipDescription?: string;
  tooltipExample?: string;
};
