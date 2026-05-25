import type { NavigationGroup, NavigationItem } from "../../navigation/navigationTypes";

export type SmartSidebarProps = {
  groups: NavigationGroup[];
  activePath?: string;
  favorites?: NavigationItem[];
  recentItems?: NavigationItem[];
  onNavigate?: (item: NavigationItem) => void;
};
