"use client";

import {
  Avatar,
  Column,
  Icon,
  IconButton,
  Media,
  Row,
  SmartLink,
  Text,
} from "@once-ui-system/core";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import type { NowReadingMini } from "@/lib/reading/home";
import type { HeaderUser } from "./AppHeader";
import { BrandMark } from "./BrandMark";
import { isActive, navItems } from "./nav";

type SidebarProps = { user: HeaderUser; nowReading: NowReadingMini | null };

/** Desktop navigation: brand, sections, the book on the go, and the account. */
export function Sidebar({ user, nowReading }: SidebarProps) {
  const pathname = usePathname() ?? "/";
  const name = user.name?.trim() || user.email || "You";

  return (
    <Column
      as="aside"
      aria-label="Sidebar"
      position="sticky"
      top="0"
      style={{ width: "17rem", flexShrink: 0, height: "100dvh" }}
      paddingX="20"
      paddingY="24"
      gap="32"
      borderRight="neutral-alpha-weak"
      m={{ hide: true }}
    >
      <BrandMark />

      <Column as="nav" aria-label="Main" gap="4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <SmartLink
              key={item.href}
              href={item.href}
              unstyled
              aria-current={active ? "page" : undefined}
            >
              <Row
                vertical="center"
                gap="12"
                paddingX="12"
                paddingY="8"
                radius="m"
                background={active ? "neutral-alpha-weak" : undefined}
              >
                <Icon
                  name={item.icon}
                  size="s"
                  onBackground={active ? "neutral-strong" : "neutral-weak"}
                />
                <Text
                  variant="body-default-m"
                  onBackground={active ? "neutral-strong" : "neutral-weak"}
                >
                  {item.label}
                </Text>
              </Row>
            </SmartLink>
          );
        })}
      </Column>

      <Column gap="12" style={{ marginTop: "auto" }}>
        {nowReading && (
          <SmartLink href={`/library/${nowReading.id}`} unstyled>
            <Column
              padding="16"
              gap="12"
              radius="l"
              background="surface"
              border="neutral-alpha-weak"
            >
              <Row gap="12" vertical="center">
                {nowReading.coverUrl ? (
                  <Media
                    src={nowReading.coverUrl}
                    alt=""
                    sizes="48px"
                    radius="xs"
                    style={{ width: "2.75rem", height: "4.125rem", flexShrink: 0 }}
                  />
                ) : null}
                <Column gap="2" style={{ minWidth: 0 }}>
                  <Text
                    variant="label-default-xs"
                    onBackground="neutral-weak"
                    style={{ letterSpacing: ".08em", textTransform: "uppercase" }}
                  >
                    Now reading
                  </Text>
                  <Text
                    variant="label-strong-s"
                    onBackground="neutral-strong"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {nowReading.title}
                  </Text>
                </Column>
              </Row>
              <Row
                fillWidth
                height="4"
                radius="full"
                background="neutral-alpha-medium"
                overflow="hidden"
              >
                <Row
                  fillHeight
                  solid="brand-strong"
                  style={{ width: `${nowReading.progress.percent}%` }}
                />
              </Row>
              <Row horizontal="between">
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  {nowReading.progress.page !== null && nowReading.progress.totalPages
                    ? `p. ${nowReading.progress.page} / ${nowReading.progress.totalPages}`
                    : "In progress"}
                </Text>
                <Text variant="label-default-xs" onBackground="neutral-weak">
                  {nowReading.progress.percent}%
                </Text>
              </Row>
            </Column>
          </SmartLink>
        )}

        <Row vertical="center" gap="8" paddingTop="12" borderTop="neutral-alpha-weak">
          <SmartLink href="/profile" unstyled style={{ flex: 1, minWidth: 0 }}>
            <Row vertical="center" gap="12" paddingY="4">
              <Avatar size="m" src={user.image ?? undefined} value={name.charAt(0).toUpperCase()} />
              <Text
                variant="label-default-s"
                onBackground="neutral-strong"
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {name}
              </Text>
            </Row>
          </SmartLink>
          <IconButton
            href="/settings"
            icon="settings"
            variant="tertiary"
            tooltip="Settings"
            aria-label="Settings"
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
      </Column>
    </Column>
  );
}
