import { Badge, Book, Button, Card, Column, Heading, Row, Text } from "@once-ui-system/core";
import { notFound } from "next/navigation";
import { BookEditor } from "@/components/library";
import { getBookDetail } from "@/lib/library/book";
import { requireUser } from "@/lib/session";

type BookPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: BookPageProps) {
  const { id } = await params;
  const user = await requireUser(`/library/${id}`);
  const book = await getBookDetail(user.id, id);
  return { title: book ? `${book.title} · Shelfie` : "Book · Shelfie" };
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;
  const user = await requireUser(`/library/${id}`);
  const book = await getBookDetail(user.id, id);
  if (!book) notFound();

  const facts = [
    book.pages ? `${book.pages.toLocaleString("en")} pages` : null,
    book.firstPublishedYear ? `First published ${book.firstPublishedYear}` : null,
    book.readCount > 1 ? `Read ${book.readCount} times` : null,
  ].filter(Boolean);

  return (
    <Column maxWidth="m" gap="24" paddingY="40" s={{ paddingY: "24" }}>
      <Row>
        <Button href="/library" variant="tertiary" size="s" prefixIcon="chevronLeft">
          Library
        </Button>
      </Row>

      <Row gap="32" s={{ direction: "column" }}>
        <Column maxWidth={12} gap="16">
          <Book src={book.coverUrl ?? undefined} alt={`Cover of ${book.title}`} sizes={240}>
            {!book.coverUrl && (
              <Column fill padding="12" paddingLeft="16" vertical="end" background="brand-strong">
                <Text variant="heading-strong-s" onBackground="neutral-strong">
                  {book.title}
                </Text>
              </Column>
            )}
          </Book>
        </Column>

        <Column flex={1} gap="24">
          <Column gap="8">
            <Heading as="h1" variant="display-strong-xs">
              {book.title}
            </Heading>
            <Text variant="body-default-l" onBackground="neutral-weak">
              {book.authors.join(", ")}
            </Text>
            {facts.length > 0 && (
              <Text variant="body-default-s" onBackground="neutral-weak">
                {facts.join(" · ")}
              </Text>
            )}
            {book.genres.length > 0 && (
              <Row gap="8" wrap>
                {book.genres.map((genre) => (
                  <Badge
                    key={genre}
                    textVariant="label-default-s"
                    onBackground="neutral-medium"
                    border="neutral-alpha-medium"
                  >
                    {genre}
                  </Badge>
                ))}
              </Row>
            )}
          </Column>

          <Card
            direction="column"
            padding="24"
            radius="xl"
            border="neutral-alpha-medium"
            fillWidth
            s={{ padding: "16" }}
          >
            <BookEditor userBookId={book.id} initial={book.edit} />
          </Card>
        </Column>
      </Row>
    </Column>
  );
}
