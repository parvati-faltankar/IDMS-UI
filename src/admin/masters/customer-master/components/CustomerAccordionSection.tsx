import type React from 'react';
import { MasterFormAccordionSection } from '../../../../experience/components';

type CustomerAccordionSectionProps = {
  title: string;
  description?: string;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CustomerAccordionSection({
  title,
  description,
  summary,
  actions,
  defaultOpen = true,
  children,
}: CustomerAccordionSectionProps) {
  return (
    <MasterFormAccordionSection
      title={title}
      description={description}
      summary={summary}
      actions={actions}
      defaultOpen={defaultOpen}
    >
      {children}
    </MasterFormAccordionSection>
  );
}
