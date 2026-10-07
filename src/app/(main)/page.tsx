import {
  Book,
  Button,
  Card,
  Column,
  Grid,
  Heading,
  Icon,
  Row,
  Schema,
  Text,
} from "@once-ui-system/core";
import { baseURL, meta } from "@/resources/seo";
import type { IconName } from "@/resources/icons";

const sampleShelf = [
  { title: "The Thriller Binger", stat: "48 books", background: "brand-strong" },
  { title: "Top genre", stat: "Fantasy", background: "accent-strong" },
  { title: "Pages read", stat: "14,280", background: "neutral-strong" },
] as const;

const features: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "upload",
    title: "Bring your Goodreads history",
    body: "Upload your Goodreads export once. Shelfie matches every book, fixes covers and keeps your ratings.",
  },
  {
    icon: "library",
    title: "Track what you read next",
    body: "Log progress in two taps, set a yearly goal and keep reviews, quotes and re-reads in one place.",
  },
  {
    icon: "wrap",
    title: "Share your Year Shelfie",
    body: "Your reading year as story cards, sized for Instagram Stories, Reels and feed posts.",
  },
];

export default function Home() {
  return (
    <Column fillWidth horizontal="center" gap="104" paddingTop="80" s={{ paddingTop: "40" }}>
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={meta.home.title}
        description={meta.home.description}
        path={meta.home.path}
      />

      <Row maxWidth="l" gap="64" vertical="center" s={{ direction: "column" }}>
        <Column flex={1} gap="24">
          <Heading as="h1" variant="display-strong-l" wrap="balance">
            Your year in books, ready to post
          </Heading>
          <Text variant="heading-default-l" onBackground="neutral-weak" wrap="balance">
            Import your Goodreads history, track every read, and turn it all into a shareable Year
            Shelfie.
          </Text>
          <Row gap="12" marginTop="8" s={{ direction: "column" }}>
            <Button href="/import" prefixIcon="upload" size="l">
              Import from Goodreads
            </Button>
            <Button href="/wrap" variant="secondary" size="l" arrowIcon>
              See a sample wrap
            </Button>
          </Row>
        </Column>

        <Row flex={1} fillWidth gap="20" horizontal="center" s={{ gap: "12" }}>
          {sampleShelf.map((book) => (
            <Book
              key={book.title}
              flex={1}
              maxWidth={10}
              aria-label={`${book.title}: ${book.stat}`}
            >
              <Column
                fill
                padding="16"
                paddingLeft="20"
                vertical="end"
                gap="4"
                background={book.background}
              >
                <Text variant="label-default-s" onBackground="neutral-weak">
                  {book.title}
                </Text>
                <Text variant="heading-strong-m" onBackground="neutral-strong">
                  {book.stat}
                </Text>
              </Column>
            </Book>
          ))}
        </Row>
      </Row>

      <Grid maxWidth="l" columns="3" gap="16" s={{ columns: 1 }}>
        {features.map((feature) => (
          <Card
            key={feature.title}
            direction="column"
            padding="24"
            gap="12"
            radius="l"
            border="neutral-alpha-medium"
          >
            <Icon name={feature.icon} size="m" onBackground="brand-strong" />
            <Heading as="h2" variant="heading-strong-m">
              {feature.title}
            </Heading>
            <Text variant="body-default-m" onBackground="neutral-weak">
              {feature.body}
            </Text>
          </Card>
        ))}
      </Grid>
    </Column>
  );
}
