import type { HelpTopic } from "../../help/helpTypes";

export type HelpDrawerProps = {
  open: boolean;
  topic?: HelpTopic;
  onClose: () => void;
  titleFallback?: string;
};
