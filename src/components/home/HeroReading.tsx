"use client";

import { Button, Column, Heading, Media, Row, SmartLink, Text } from "@once-ui-system/core";
import { useState } from "react";
import { paceLine, progressLine } from "@/lib/reading/format";
import type { ReadingNow } from "@/lib/reading/home";
import { FinishDialog } from "./FinishDialog";
import { PageStepper } from "./PageStepper";
import { ProgressTrack } from "./ProgressTrack";

/** The book you're most into right now, on a backdrop made from its own cover. */
export function HeroReading({ book }: { book: ReadingNow }) {
  const [finishing, setFinishing] = useState(false);

  return (
    <Column
      as="section"
      aria-label="Currently reading"
      flex={2}
      position="relative"
      overflow="hidden"
      radius="xl"
      background="surface"
      style={{ minWidth: "min(100%, 32rem)", minHeight: "21rem" }}
    >
      {book.coverUrl && (
        <Media
          src={book.coverUrl}
          alt=""
          aria-hidden
          sizes="400px"
          position="absolute"
          style={{
            inset: "-3rem",
            width: "calc(100% + 6rem)",
            height: "calc(100% + 6rem)",
            filter: "blur(48px) saturate(1.2)",
            opacity: 0.55,
          }}
        />
      )}
      <Column
        position="absolute"
        style={{
          inset: 0,
          background:
            "linear-gradient(90deg, color-mix(in oklch, var(--page-background) 92%, transparent) 0%, color-mix(in oklch, var(--page-background) 55%, transparent) 60%, color-mix(in oklch, var(--page-background) 35%, transparent) 100%)",
        }}
      />
      <Row
        position="relative"
        gap="32"
        padding="32"
        vertical="center"
        wrap
        s={{ padding: "20", gap: "20" }}
      >
        <SmartLink href={`/library/${book.id}`} unstyled aria-label={`Open ${book.title}`}>
          {book.coverUrl ? (
            <Media
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              sizes="200px"
              radius="s"
              style={{ width: "11rem", height: "16.5rem", boxShadow: "0 24px 48px rgba(0,0,0,.5)" }}
              s={{ style: { width: "7.5rem", height: "11.25rem" } }}
            />
          ) : (
            <Column
              radius="s"
              solid="brand-medium"
              padding="16"
              vertical="end"
              style={{ width: "11rem", height: "16.5rem" }}
            >
              <Text variant="heading-strong-s">{book.title}</Text>
            </Column>
          )}
        </SmartLink>
        <Column flex={1} gap="12" style={{ minWidth: "15rem" }}>
          <Text
            variant="label-default-s"
            onBackground="brand-weak"
            style={{ letterSpacing: ".1em", textTransform: "uppercase" }}
          >
            Currently reading
          </Text>
          <SmartLink href={`/library/${book.id}`} unstyled>
            <Heading as="h2" variant="display-strong-xs" onBackground="neutral-strong">
              {book.title}
            </Heading>
          </SmartLink>
          {book.author && (
            <Text variant="body-default-m" onBackground="neutral-medium">
              {book.author}
            </Text>
          )}
          <Column gap="8" marginTop="8">
            <ProgressTrack
              percent={book.progress.percent}
              label={`${book.title} progress`}
              height={6}
            />
            <Row horizontal="between" gap="12" wrap>
              <Text variant="label-default-s" onBackground="neutral-medium">
                {progressLine(book)}
              </Text>
              <Text variant="label-default-s" onBackground="neutral-medium">
                {paceLine(book)}
              </Text>
            </Row>
          </Column>
          <Row gap="8" wrap marginTop="8" vertical="center">
            <PageStepper
              userBookId={book.id}
              page={book.progress.page}
              percent={book.progress.percent}
              totalPages={book.progress.totalPages}
            />
            <Button
              size="l"
              variant="tertiary"
              prefixIcon="check"
              onClick={() => setFinishing(true)}
            >
              Finished
            </Button>
          </Row>
        </Column>
      </Row>
      {finishing && (
        <FinishDialog
          open
          onClose={() => setFinishing(false)}
          userBookId={book.id}
          title={book.title}
        />
      )}
    </Column>
  );
}
