import type { HelpTopic } from '../../help/helpTypes';

export type HelpDrawerProps = {
  open: boolean;
  topic?: HelpTopic;
  onClose: () => void;
  titleFallback?: string;
  /** Called when the user clicks a related topic chip to navigate to that topic. */
  onTopicChange?: (topicId: string) => void;
};
