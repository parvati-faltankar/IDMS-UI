export type HelpTopicStep = {
  title: string;
  description?: string;
};

/** Canonical alias for HelpTopicStep used in new code. */
export type HelpStep = HelpTopicStep;

/** A single plain-text tip string. */
export type HelpTip = string;

/** Field-level inline help for complex form fields. */
export type FieldHelp = {
  /** Unique field key matching the form field name. */
  key: string;
  /** Short display title shown in the popover header. */
  title: string;
  /** Clear explanation of what the field means and when to use it. */
  description: string;
  /** Optional concrete example value or format. */
  example?: string;
};

export type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  steps?: HelpTopicStep[];
  tips?: string[];
  commonMistakes?: string[];
  relatedTopics?: string[];
};
