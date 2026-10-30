import { Column, Media, Row, SmartLink, Text } from "@once-ui-system/core";
import type { ReadingNow } from "@/lib/reading/home";
import { paceLine, progressLine } from "@/lib/reading/format";
import { PageStepper } from "./PageStepper";
import { ProgressTrack } from "./ProgressTrack";

/** Other books on the go: one compact row each, with the same in-place logging. */
export function AlsoReading({ books }: { books: ReadingNow[] }) {
  return (
    <Column gap="8">
      {books.map((book) => (
        <Row
          key={book.id}
          gap="16"
          paddingX="16"
          paddingY="12"
          radius="l"
          background="surface"
          border="neutral-alpha-weak"
          vertical="center"
          wrap
        >
          <SmartLink href={`/library/${book.id}`} unstyled aria-label={`Open ${book.title}`}>
            {book.coverUrl ? (
              <Media
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                sizes="60px"
                radius="xs"
                style={{ width: "2.5rem", height: "3.75rem" }}
              />
            ) : (
              <Row
                radius="xs"
                solid="brand-medium"
                style={{ width: "2.5rem", height: "3.75rem" }}
              />
            )}
          </SmartLink>
          <Column flex={1} gap="8" style={{ minWidth: "12rem" }}>
            <Row horizontal="between" gap="12" wrap>
              <Text variant="label-strong-m" onBackground="neutral-strong">
                {book.title}
                {book.author && (
                  <Text variant="label-default-m" onBackground="neutral-weak">
                    {" "}
                    · {book.author}
                  </Text>
                )}
              </Text>
              <Text variant="label-default-s" onBackground="neutral-weak">
                {progressLine(book)} · {paceLine(book)}
              </Text>
            </Row>
            <ProgressTrack percent={book.progress.percent} label={`${book.title} progress`} />
          </Column>
          <PageStepper
            userBookId={book.id}
            page={book.progress.page}
            percent={book.progress.percent}
            totalPages={book.progress.totalPages}
            size="m"
          />
        </Row>
      ))}
    </Column>
  );
}
