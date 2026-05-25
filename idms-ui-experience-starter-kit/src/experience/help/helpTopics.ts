import type { HelpTopic } from "./helpTypes";

export const helpTopics: HelpTopic[] = [
  {
    id: "admin-dashboard",
    title: "How Admin Setup Works",
    summary:
      "Use Admin Setup to configure the foundation of the application before business users start working with transactions.",
    steps: [
      {
        title: "Start with organisation setup",
        description:
          "Confirm the legal entity, branch, contact, tax, and branding information first.",
      },
      {
        title: "Configure numbering",
        description:
          "Set prefixes and numbering policies before users create documents or master records.",
      },
      {
        title: "Prepare picklists",
        description:
          "Define dropdown values and dependent selections used across forms.",
      },
      {
        title: "Configure KYC rules",
        description:
          "Define country-wise proof requirements for customers, suppliers, employees, vendors, and partners.",
      },
      {
        title: "Review roles and templates",
        description:
          "Set access roles and print templates after the core setup is ready.",
      },
    ],
    tips: [
      "Use Save as Draft when a configuration is incomplete.",
      "Activate only after validation checks pass.",
      "Use Recently Visited to resume configuration quickly.",
    ],
    commonMistakes: [
      "Activating code policies before selecting a valid prefix.",
      "Creating transaction data before required picklists are ready.",
      "Leaving KYC proof rules inactive after configuration.",
    ],
    relatedTopics: ["numbering-code-setup", "picklist-master", "kyc-setup"],
  },
  {
    id: "kyc-setup",
    title: "How KYC Setup Works",
    summary:
      "KYC Setup defines which proof documents are required for each entity type and country, including document number and attachment rules.",
    steps: [
      { title: "Select entity and entity type" },
      { title: "Add country-wise proof rules" },
      { title: "Configure document number validation" },
      { title: "Configure attachment requirements" },
      { title: "Resolve validation checklist items" },
      { title: "Activate the setup" },
    ],
    tips: [
      "Use regex only when the document number must follow a strict format.",
      "Attachment rules should mention allowed file types and maximum file count.",
      "Inactive proof rows should not be used for runtime validation.",
    ],
    commonMistakes: [
      "Adding proof rows without activating them.",
      "Using regex and conflicting length rules without clear intent.",
      "Forgetting to add at least one active proof before activation.",
    ],
    relatedTopics: ["admin-dashboard"],
  },
  {
    id: "picklist-master",
    title: "How Picklist Master Works",
    summary:
      "Picklist Master defines dropdown values used across the application, including dependent and multi-level dependent lists.",
    steps: [
      { title: "Choose the configuration type" },
      { title: "Define one or more levels" },
      { title: "Add values for each level" },
      { title: "Map parent and child values when dependencies exist" },
      { title: "Activate only valid values" },
    ],
    tips: [
      "Keep display names user-friendly.",
      "Use sort order to control dropdown ordering.",
      "Avoid duplicate values unless reuse is intentionally allowed.",
    ],
  },
  {
    id: "numbering-code-setup",
    title: "How Numbering & Code Setup Works",
    summary:
      "Numbering setup controls prefixes and sequence rules used to generate document and master codes.",
    steps: [
      { title: "Create a prefix for the entity" },
      { title: "Define series type and number length" },
      { title: "Choose reset behavior if required" },
      { title: "Preview the generated sample" },
      { title: "Activate the configuration" },
    ],
  },
  {
    id: "code-generation-policy",
    title: "How Code Generation Policy Works",
    summary:
      "A code generation policy combines prefix, series, reset, padding, and case rules for a specific entity.",
    steps: [
      { title: "Fill basic policy details" },
      { title: "Select applicability" },
      { title: "Choose prefix" },
      { title: "Define series and number format" },
      { title: "Review preview and activate" },
    ],
  },
];

export function getHelpTopic(topicId?: string): HelpTopic | undefined {
  if (!topicId) return undefined;
  return helpTopics.find((topic) => topic.id === topicId);
}
