export type EmptyStateGuideProps = {
  /** Primary heading — one short phrase describing what is empty. */
  title: string;
  /** Supporting text — explain what to do or why nothing is here. */
  description: string;
  /** Label for the primary call-to-action button. */
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  /** Label for the secondary (ghost) action button. */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /**
   * Compact mode — reduces padding and icon size for use inside panels or
   * section tabs where vertical space is limited.
   */
  compact?: boolean;
};
