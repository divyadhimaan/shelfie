import { Column, Heading, Media, Row, Text } from "@once-ui-system/core";
import type { ReactNode } from "react";

type BookHeroProps = {
  title: string;
  authors: string[];
  coverUrl: string | null;
  facts: string[];
  genres: string[];
  /** Status line and actions under the title */
  children?: ReactNode;
};

/** Book page header on a backdrop made from the cover (design direction A). */
export function BookHero({ title, authors, coverUrl, facts, genres, children }: BookHeroProps) {
  return (
    <Column
      as="section"
      aria-label={title}
      position="relative"
      overflow="hidden"
      radius="xl"
      background="surface"
    >
      {coverUrl && (
        <Media
          src={coverUrl}
          alt=""
          aria-hidden
          sizes="400px"
          position="absolute"
          style={{
            inset: "-3rem",
            width: "calc(100% + 6rem)",
            height: "calc(100% + 6rem)",
            filter: "blur(56px) saturate(1.3)",
            opacity: 0.6,
          }}
        />
      )}
      <Column
        position="absolute"
        style={{
          inset: 0,
          background:
            "linear-gradient(180deg, color-mix(in oklch, var(--page-background) 30%, transparent) 0%, color-mix(in oklch, var(--page-background) 80%, transparent) 70%, var(--surface-background) 100%)",
        }}
      />
      <Row
        position="relative"
        gap="40"
        padding="40"
        vertical="end"
        wrap
        s={{ padding: "20", gap: "24" }}
      >
        {coverUrl ? (
          <Media
            src={coverUrl}
            alt={`Cover of ${title}`}
            sizes="240px"
            radius="s"
            priority
            style={{
              width: "12rem",
              height: "18rem",
              flexShrink: 0,
              boxShadow: "0 24px 56px rgba(0,0,0,.55)",
            }}
            s={{ style: { width: "8.5rem", height: "12.75rem" } }}
          />
        ) : (
          <Column
            radius="s"
            solid="brand-medium"
            padding="16"
            vertical="end"
            style={{ width: "12rem", height: "18rem", flexShrink: 0 }}
          >
            <Text variant="heading-strong-m">{title}</Text>
          </Column>
        )}
        <Column flex={1} gap="12" style={{ minWidth: "16rem" }}>
          <Heading as="h1" variant="display-strong-s" onBackground="neutral-strong">
            {title}
          </Heading>
          <Text variant="body-default-l" onBackground="neutral-medium">
            {[authors.join(", "), ...facts].filter(Boolean).join(" · ")}
          </Text>
          {genres.length > 0 && (
            <Row gap="8" wrap>
              {genres.map((genre) => (
                <Row
                  key={genre}
                  paddingX="12"
                  paddingY="4"
                  radius="full"
                  border="neutral-alpha-medium"
                >
                  <Text variant="label-default-s" onBackground="neutral-strong">
                    {genre}
                  </Text>
                </Row>
              ))}
            </Row>
          )}
          {children && (
            <Column gap="12" marginTop="8">
              {children}
            </Column>
          )}
        </Column>
      </Row>
    </Column>
  );
}
