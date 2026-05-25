import type { CommandItem } from '../../navigation/navigationTypes';

export type CommandPaletteProps = {
  open: boolean;
  commands: CommandItem[];
  onClose: () => void;
  onExecute: (command: CommandItem) => void;
};
