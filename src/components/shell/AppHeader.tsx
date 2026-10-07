"use client";

import { usePathname } from "next/navigation";
import { Row, SmartLink, Text, ThemeSwitcher, ToggleButton } from "@once-ui-system/core";
import { isActive, navItems } from "./nav";

export function AppHeader() {
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
        <ThemeSwitcher collapsed direction="row" />
      </Row>
    </Row>
  );
}
