"use client";

import { Avatar, Button, Row, SmartLink } from "@once-ui-system/core";
import { BrandMark } from "./BrandMark";

export type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Top bar. Signed out: brand and Sign in, on every screen size.
 * Signed in: only on tablets and phones, where the sidebar is hidden.
 */
export function AppHeader({ user }: { user: HeaderUser | null }) {
  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();

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
      {...(user ? { hide: true, m: { hide: false } } : {})}
    >
      <Row maxWidth="l" vertical="center" horizontal="between" gap="16">
        <BrandMark />
        {user ? (
          <SmartLink href="/profile" unstyled aria-label="Your profile">
            <Avatar size="m" src={user.image ?? undefined} value={initial} />
          </SmartLink>
        ) : (
          <Button href="/signin" size="m" variant="secondary">
            Sign in
          </Button>
        )}
      </Row>
    </Row>
  );
}
