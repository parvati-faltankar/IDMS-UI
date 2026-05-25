export type FieldHelpItem = {
  id: string;
  title: string;
  description: string;
  example?: string;
};

export const fieldHelpItems: FieldHelpItem[] = [
  {
    id: "regex-pattern",
    title: "Regex Pattern",
    description:
      "Use regex when a document number must follow a strict format. Regex should override simpler character and length rules.",
    example: "PAN-like format: five letters, four numbers, one letter.",
  },
  {
    id: "prefix-value",
    title: "Prefix Value",
    description:
      "Prefix is fixed text added before a generated number, such as PO, SO, CUST, or SUP.",
    example: "PO-00001",
  },
  {
    id: "series-type",
    title: "Series Type",
    description:
      "Series Type decides whether numbering continues forever or resets by calendar year, financial year, month, or day.",
  },
  {
    id: "number-consumption-event",
    title: "Number Consumption Event",
    description:
      "Controls when a generated number becomes permanently used, such as on Save Draft or on Submit/Activate.",
  },
  {
    id: "entity-type",
    title: "Entity Type",
    description:
      "Entity Type narrows a setup to a business category, such as Individual Customer or Corporate Customer.",
  },
];

export function getFieldHelp(id?: string): FieldHelpItem | undefined {
  if (!id) return undefined;
  return fieldHelpItems.find((item) => item.id === id);
}
