import { Badge, Book, Column, Grid, Text } from "@once-ui-system/core";
import type { LibraryBook } from "@/lib/library/queries";

const STATUS_LABEL: Record<LibraryBook["status"], string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  read: "Read",
  dnf: "DNF",
  paused: "Paused",
};

function stars(rating: number) {
  return `${"★".repeat(Math.floor(rating))}${rating % 1 ? "½" : ""}`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function LibraryGrid({ books }: { books: LibraryBook[] }) {
  return (
    <Grid columns="5" gap="24" m={{ columns: 4 }} s={{ columns: 2 }}>
      {books.map((book) => (
        <Column key={book.id} gap="12">
          <Book src={book.coverUrl ?? undefined} alt={`Cover of ${book.title}`} sizes={200}>
            {!book.coverUrl && (
              <Column fill padding="12" paddingLeft="16" vertical="end" background="brand-strong">
                <Text variant="heading-strong-s" onBackground="neutral-strong">
                  {book.title}
                </Text>
              </Column>
            )}
          </Book>
          <Column gap="4">
            <Text variant="label-strong-m" style={{ overflowWrap: "anywhere" }}>
              {book.title}
            </Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              {book.authors[0]}
              {book.authors.length > 1 ? " and others" : ""}
            </Text>
            <Text variant="body-default-s" onBackground="neutral-medium">
              {book.rating ? (
                <span aria-label={`${book.rating} stars`}>{stars(book.rating)}</span>
              ) : null}
              {book.rating && book.finishedAt ? " · " : null}
              {book.finishedAt ? formatDate(book.finishedAt) : null}
            </Text>
          </Column>
          {book.status !== "read" && (
            <Badge
              textVariant="label-default-s"
              onBackground="neutral-medium"
              border="neutral-alpha-medium"
              fitWidth
            >
              {STATUS_LABEL[book.status]}
            </Badge>
          )}
        </Column>
      ))}
    </Grid>
  );
}
