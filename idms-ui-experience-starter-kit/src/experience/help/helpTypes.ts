export type HelpTopicStep = {
  title: string;
  description?: string;
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
