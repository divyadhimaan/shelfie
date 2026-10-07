import type { IconName } from "@/resources/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

export const navItems: NavItem[] = [
  { href: "/library", label: "Library", icon: "library" },
  { href: "/stats", label: "Stats", icon: "stats" },
  { href: "/wrap", label: "Wrap", icon: "wrap" },
  { href: "/import", label: "Import", icon: "upload" },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);
