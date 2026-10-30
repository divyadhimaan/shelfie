import { Book, Column, Row, Text } from "@once-ui-system/core";
import type { ReactNode } from "react";
import type { HomeBook } from "@/lib/reading/home";

type CoverShelfProps = {
  books: (HomeBook & { caption?: string })[];
  /** Optional control under each cover, e.g. a Start button */
  action?: (book: HomeBook) => ReactNode;
};

/** A horizontally scrolling row of covers; snaps on touch. */
export function CoverShelf({ books, action }: CoverShelfProps) {
  return (
    <Row
      fillWidth
      gap="16"
      paddingBottom="8"
      style={{ overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "thin" }}
    >
      {books.map((book) => (
        <Column key={book.id} gap="8" style={{ flex: "0 0 8.5rem", scrollSnapAlign: "start" }}>
          <Book
            href={`/library/${book.id}`}
            src={book.coverUrl ?? undefined}
            alt={`Cover of ${book.title}`}
            sizes={160}
          >
            {!book.coverUrl && (
              <Column fill padding="12" paddingLeft="16" vertical="end" background="brand-strong">
                <Text variant="label-strong-s" onBackground="neutral-strong">
                  {book.title}
                </Text>
              </Column>
            )}
          </Book>
          <Column gap="2">
            <Text
              variant="label-strong-s"
              onBackground="neutral-strong"
              style={{ overflowWrap: "anywhere" }}
            >
              {book.title}
            </Text>
            {book.caption && (
              <Text variant="label-default-xs" onBackground="neutral-weak">
                {book.caption}
              </Text>
            )}
          </Column>
          {action?.(book)}
        </Column>
      ))}
    </Row>
  );
}
