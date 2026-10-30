"use client";

import { Book, Button, Column, ProgressBar, Row, SmartLink, Text } from "@once-ui-system/core";
import { useState } from "react";
import type { ReadingNow } from "@/lib/reading/home";
import { FinishDialog } from "./FinishDialog";
import { ProgressDialog } from "./ProgressDialog";

function progressLine(book: ReadingNow) {
  const { page, totalPages, percent } = book.progress;
  if (page !== null && totalPages) return `Page ${page} of ${totalPages} · ${percent}%`;
  return `${percent}%`;
}

function paceLine(book: ReadingNow) {
  if (book.daysLeft !== null)
    return book.daysLeft <= 1 ? "Done in about a day" : `About ${book.daysLeft} days left`;
  if (book.startedAt) {
    const started = new Date(`${book.startedAt}T00:00:00Z`).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return `Started ${started}`;
  }
  return "Log a page to see your pace";
}

export function ReadingNowCard({ book }: { book: ReadingNow }) {
  const [dialog, setDialog] = useState<"progress" | "finish" | null>(null);

  return (
    <Row
      fillWidth
      gap="20"
      padding="16"
      radius="l"
      border="neutral-alpha-weak"
      background="surface"
      vertical="center"
    >
      <Column maxWidth={5.5} flex={0} style={{ flexShrink: 0, width: "5.5rem" }}>
        <Book
          href={`/library/${book.id}`}
          src={book.coverUrl ?? undefined}
          alt={`Cover of ${book.title}`}
          sizes={120}
        />
      </Column>
      <Column flex={1} gap="12" style={{ minWidth: 0 }}>
        <Column gap="2">
          <SmartLink href={`/library/${book.id}`} unstyled>
            <Text variant="heading-strong-s" onBackground="neutral-strong">
              {book.title}
            </Text>
          </SmartLink>
          {book.author && (
            <Text variant="body-default-s" onBackground="neutral-weak">
              {book.author}
            </Text>
          )}
        </Column>
        <Column gap="8">
          <ProgressBar
            value={book.progress.percent}
            showLabel={false}
            aria-label={`${book.title} progress`}
          />
          <Row horizontal="between" gap="12" wrap>
            <Text variant="label-default-s" onBackground="neutral-medium">
              {progressLine(book)}
            </Text>
            <Text variant="label-default-s" onBackground="neutral-weak">
              {paceLine(book)}
            </Text>
          </Row>
        </Column>
        <Row gap="8" wrap>
          <Button size="s" onClick={() => setDialog("progress")}>
            Update progress
          </Button>
          <Button
            size="s"
            variant="tertiary"
            prefixIcon="check"
            onClick={() => setDialog("finish")}
          >
            Finished
          </Button>
        </Row>
      </Column>

      {dialog === "progress" && (
        <ProgressDialog
          open
          onClose={() => setDialog(null)}
          userBookId={book.id}
          title={book.title}
          page={book.progress.page}
          percent={book.progress.percent}
          totalPages={book.progress.totalPages}
        />
      )}
      {dialog === "finish" && (
        <FinishDialog
          open
          onClose={() => setDialog(null)}
          userBookId={book.id}
          title={book.title}
        />
      )}
    </Row>
  );
}
