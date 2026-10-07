"use client";

import { usePathname } from "next/navigation";
import {
  Avatar,
  Button,
  IconButton,
  Row,
  SmartLink,
  Text,
  ThemeSwitcher,
  ToggleButton,
} from "@once-ui-system/core";
import { signOutAction } from "@/app/actions/auth";
import { isActive, navItems } from "./nav";

export type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AppHeaderProps = {
  user: HeaderUser | null;
};

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname() ?? "/";

  return (
    <Row
      as="header"
      position="sticky"
      zIndex={9}
      fillWidth
      horizontal="center"
      background="page"
      borderBottom="neutral-alpha-weak"
      paddingX="l"
      paddingY="12"
      s={{ paddingX: "16" }}
    >
      <Row maxWidth="l" vertical="center" horizontal="between" gap="16">
        <SmartLink href="/" unstyled aria-label="Shelfie home">
          <Text variant="heading-strong-l" onBackground="brand-strong">
            Shelfie
          </Text>
        </SmartLink>
        <Row as="nav" aria-label="Main" gap="4" vertical="center" s={{ hide: true }}>
          {navItems.map((item) => (
            <ToggleButton
              key={item.href}
              href={item.href}
              prefixIcon={item.icon}
              label={item.label}
              selected={isActive(pathname, item.href)}
            />
          ))}
        </Row>
        <Row gap="8" vertical="center">
          <ThemeSwitcher collapsed direction="row" />
          {user ? (
            <Row gap="8" vertical="center">
              <Avatar
                size="m"
                src={user.image ?? undefined}
                value={(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                aria-label={user.name ?? user.email ?? "Your account"}
              />
              <form action={signOutAction}>
                <IconButton
                  type="submit"
                  icon="logout"
                  variant="tertiary"
                  tooltip="Sign out"
                  aria-label="Sign out"
                />
              </form>
            </Row>
          ) : (
            <Button href="/signin" size="m" variant="secondary">
              Sign in
            </Button>
          )}
        </Row>
      </Row>
    </Row>
  );
}
