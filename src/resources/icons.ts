import type { IconType } from "react-icons";

import {
  HiOutlineArrowUpTray,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineHome,
  HiOutlineSparkles,
} from "react-icons/hi2";

// Merged with Once UI's built-in icons by IconProvider.
export const iconLibrary = {
  home: HiOutlineHome,
  library: HiOutlineBookOpen,
  upload: HiOutlineArrowUpTray,
  stats: HiOutlineChartBar,
  wrap: HiOutlineSparkles,
} satisfies Record<string, IconType>;

type CustomIcons = { [K in keyof typeof iconLibrary]: true };

// Registers the custom names so <Icon name="..."> type-checks them.
declare module "@once-ui-system/core" {
  interface IconLibraryOverrides extends CustomIcons {}
}

export type { IconName } from "@once-ui-system/core";
