"use client";

import { usePathname } from "next/navigation";
import { Column, Icon, Row, SmartLink, Text } from "@once-ui-system/core";
import { isActive, navItems } from "./nav";

// Phone-only tab bar: Shelfie is a PWA, so the main actions sit under the thumb.
export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <Row
      as="nav"
      aria-label="Main"
      hide
      s={{ hide: false }}
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex={9}
      background="surface"
      borderTop="neutral-alpha-medium"
      paddingY="8"
      horizontal="around"
    >
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <SmartLink
            key={item.href}
            href={item.href}
            unstyled
            aria-current={active ? "page" : undefined}
          >
            <Column horizontal="center" gap="4" paddingX="12" paddingY="4">
              <Icon
                name={item.icon}
                size="s"
                onBackground={active ? "brand-strong" : "neutral-weak"}
              />
              <Text
                variant="label-default-xs"
                onBackground={active ? "brand-strong" : "neutral-weak"}
              >
                {item.label}
              </Text>
            </Column>
          </SmartLink>
        );
      })}
    </Row>
  );
}
