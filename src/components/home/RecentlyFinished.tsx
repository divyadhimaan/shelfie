import { Column, Grid, Media, Row, SmartLink, Text } from "@once-ui-system/core";
import type { HomeBook } from "@/lib/reading/home";

type Finished = HomeBook & { finishedAt: string; rating: number | null };

const stars = (rating: number) => `${"★".repeat(Math.floor(rating))}${rating % 1 ? "½" : ""}`;
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function RecentlyFinished({ books }: { books: Finished[] }) {
  return (
    <Grid columns="3" gap="12" m={{ columns: 2 }} s={{ columns: 1 }}>
      {books.map((book) => (
        <SmartLink
          key={`${book.id}-${book.finishedAt}`}
          href={`/library/${book.id}`}
          unstyled
          style={{ minWidth: 0 }}
        >
          <Row fillWidth gap="12" padding="12" radius="l" background="surface" vertical="center">
            {book.coverUrl ? (
              <Media
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                sizes="66px"
                radius="xs"
                style={{ width: "2.75rem", height: "4.125rem", flexShrink: 0 }}
              />
            ) : (
              <Row
                radius="xs"
                solid="brand-medium"
                style={{ width: "2.75rem", height: "4.125rem", flexShrink: 0 }}
              />
            )}
            <Column gap="4" style={{ minWidth: 0 }}>
              <Text
                variant="label-strong-m"
                onBackground="neutral-strong"
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {book.title}
              </Text>
              <Text variant="label-default-s" onBackground="neutral-weak">
                {book.rating ? (
                  <Text onBackground="brand-weak" aria-label={`${book.rating} stars`}>
                    {stars(book.rating)}{" "}
                  </Text>
                ) : null}
                · {shortDate(book.finishedAt)}
              </Text>
            </Column>
          </Row>
        </SmartLink>
      ))}
    </Grid>
  );
}
