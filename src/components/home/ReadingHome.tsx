import { Button, Column, Heading, Row, Text } from "@once-ui-system/core";
import type { HomeData } from "@/lib/reading/home";
import { CoverShelf } from "./CoverShelf";
import { GoalCard } from "./GoalCard";
import { ReadingNowCard } from "./ReadingNowCard";
import { SectionHeader } from "./SectionHeader";
import { StartReadingButton } from "./StartReadingButton";

function greeting(hour: number) {
  if (hour < 5) return "Reading late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const finishedCaption = (iso: string, rating: number | null) => {
  const date = new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return rating ? `${date} · ${rating}★` : date;
};

/** The signed-in home: what you're reading, your goal, and what's next. */
export function ReadingHome({ data, name }: { data: HomeData; name: string | null }) {
  const firstName = name?.trim().split(/\s+/)[0];

  if (data.libraryCount === 0) {
    return (
      <Column maxWidth="m" gap="24" paddingY="64" s={{ paddingY: "32" }}>
        <Heading as="h1" variant="display-strong-s">
          Welcome{firstName ? `, ${firstName}` : ""}
        </Heading>
        <Column
          padding="32"
          gap="16"
          radius="xl"
          border="neutral-alpha-medium"
          background="surface"
        >
          <Heading as="h2" variant="heading-strong-m">
            Start with your Goodreads history
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-weak">
            Import your library once and your shelves, ratings and reading dates come with you.
          </Text>
          <Row>
            <Button href="/import" prefixIcon="upload" size="m">
              Import from Goodreads
            </Button>
          </Row>
        </Column>
      </Column>
    );
  }

  return (
    <Column maxWidth="l" gap="40" paddingY="48" s={{ paddingY: "24", gap: "32" }}>
      <Column gap="4">
        <Heading as="h1" variant="display-strong-xs">
          {greeting(data.hour)}
          {firstName ? `, ${firstName}` : ""}
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          {data.readingNow.length === 0
            ? "Nothing on the go. Pick something from up next."
            : `${data.readingNow.length} ${data.readingNow.length === 1 ? "book" : "books"} on the go`}
        </Text>
      </Column>

      <Row fillWidth gap="24" m={{ direction: "column" }}>
        <Column flex={2} gap="12" style={{ minWidth: 0 }}>
          <SectionHeader title="Currently reading" />
          {data.readingNow.length > 0 ? (
            <Column gap="12">
              {data.readingNow.map((book) => (
                <ReadingNowCard key={book.id} book={book} />
              ))}
            </Column>
          ) : (
            <Column padding="24" radius="l" border="neutral-alpha-weak" gap="4">
              <Text variant="body-default-m">You&apos;re between books.</Text>
              <Text variant="body-default-s" onBackground="neutral-weak">
                Press Start on anything in Up next to track it here.
              </Text>
            </Column>
          )}
        </Column>
        <Column flex={1} gap="12" style={{ minWidth: 0 }}>
          <SectionHeader title="This year" action={{ label: "Stats", href: "/stats" }} />
          <GoalCard year={data.year} goal={data.goal} finishedThisYear={data.finishedThisYear} />
        </Column>
      </Row>

      {data.upNext.length > 0 && (
        <Column gap="12">
          <SectionHeader title="Up next" action={{ label: "Library", href: "/library" }} />
          <CoverShelf
            books={data.upNext.map((b) => ({ ...b, caption: b.author ?? undefined }))}
            action={(book) => <StartReadingButton userBookId={book.id} title={book.title} />}
          />
        </Column>
      )}

      {data.recentlyFinished.length > 0 && (
        <Column gap="12">
          <SectionHeader
            title="Recently finished"
            action={{ label: "Year Shelfie", href: "/wrap" }}
          />
          <CoverShelf
            books={data.recentlyFinished.map((b) => ({
              ...b,
              caption: finishedCaption(b.finishedAt, b.rating),
            }))}
          />
        </Column>
      )}
    </Column>
  );
}
