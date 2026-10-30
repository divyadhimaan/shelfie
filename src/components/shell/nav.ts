import type { IconName } from "@/resources/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

/** Sidebar on desktop. */
export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/stats", label: "Stats", icon: "stats" },
  { href: "/wrap", label: "Year in Fineprints", icon: "wrap" },
  { href: "/import", label: "Import", icon: "upload" },
];

/** Bottom tab bar on tablets and phones: the five most-used places. */
export const tabItems: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/stats", label: "Stats", icon: "stats" },
  { href: "/wrap", label: "Wrap", icon: "wrap" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);
