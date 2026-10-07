import { Button, Column, Heading, Row, Text } from "@once-ui-system/core";
import { LibraryGrid } from "@/components/library";
import { getLibrary } from "@/lib/library/queries";
import { requireUser } from "@/lib/session";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.library.title };

export default async function LibraryPage() {
  const user = await requireUser("/library");
  const books = await getLibrary(user.id);

  return (
    <Column maxWidth="l" gap="32" paddingY="48" s={{ paddingY: "24" }}>
      <Row horizontal="between" vertical="end" gap="16" wrap>
        <Column gap="8">
          <Heading as="h1" variant="display-strong-s">
            Library
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-weak">
            {books.length} {books.length === 1 ? "book" : "books"}
          </Text>
        </Column>
        <Button href="/import" variant="secondary" size="m" prefixIcon="upload">
          Import from Goodreads
        </Button>
      </Row>

      {books.length === 0 ? (
        <Column
          padding="32"
          gap="12"
          radius="xl"
          border="neutral-alpha-medium"
          horizontal="center"
          align="center"
        >
          <Heading as="h2" variant="heading-strong-m">
            Your shelf is empty
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-weak">
            Import your Goodreads history to fill it in one go.
          </Text>
        </Column>
      ) : (
        <LibraryGrid books={books} />
      )}
    </Column>
  );
}
