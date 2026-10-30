import { Button, Column, Heading, Row, Text } from "@once-ui-system/core";
import type { ActivityDay } from "@/lib/reading/activity";
import type { HomeData } from "@/lib/reading/home";
import { AlsoReading } from "./AlsoReading";
import { CoverShelf } from "./CoverShelf";
import { GoalCard } from "./GoalCard";
import { HeroReading } from "./HeroReading";
import { RecentlyFinished } from "./RecentlyFinished";
import { SectionHeader } from "./SectionHeader";
import { StartReadingButton } from "./StartReadingButton";

function greeting(hour: number) {
  if (hour < 5) return "Reading late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function subline(data: HomeData) {
  const count = data.readingNow.length;
  if (count === 0) return "Nothing on the go. Pick something from up next.";
  const books =
    count === 1
      ? "One book on the go."
      : `${["Two", "Three", "Four"][count - 2] ?? count} books on the go.`;
  const lead = data.readingNow[0];
  return lead.daysLeft !== null
    ? `${books} At your pace you'll finish ${lead.title} in about ${lead.daysLeft} days.`
    : books;
}

type ReadingHomeProps = {
  data: HomeData;
  name: string | null;
  week: ActivityDay[];
  streak: number;
  daysLeftInYear: number;
};

/** The signed-in home (design direction A, "Midnight"). */
export function ReadingHome({ data, name, week, streak, daysLeftInYear }: ReadingHomeProps) {
  const firstName = name?.trim().split(/\s+/)[0];
  const [lead, ...others] = data.readingNow;

  if (data.libraryCount === 0) {
    return (
      <Column maxWidth="m" gap="24" paddingY="64" s={{ paddingY: "32" }}>
        <Heading as="h1" variant="display-default-m">
          Welcome{firstName ? `, ${firstName}` : ""}
        </Heading>
        <Column padding="32" gap="16" radius="xl" border="neutral-alpha-weak" background="surface">
          <Heading as="h2" variant="heading-strong-l">
            Start with your Goodreads history
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-medium">
            Import your library once and your shelves, ratings and reading dates come with you.
          </Text>
          <Row>
            <Button href="/import" prefixIcon="upload" size="l">
              Import from Goodreads
            </Button>
          </Row>
        </Column>
      </Column>
    );
  }

  return (
    <Column maxWidth="xl" gap="40" paddingY="40" s={{ paddingY: "24", gap: "32" }}>
      <Column gap="8">
        <Heading as="h1" variant="display-default-m">
          {greeting(data.hour)}
          {firstName ? `, ${firstName}` : ""}
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak">
          {subline(data)}
        </Text>
      </Column>

      <Row fillWidth gap="24" wrap vertical="stretch">
        {lead ? (
          <HeroReading book={lead} />
        ) : (
          <Column
            flex={2}
            gap="8"
            padding="32"
            radius="xl"
            background="surface"
            border="neutral-alpha-weak"
            style={{ minWidth: "min(100%, 32rem)" }}
          >
            <Heading as="h2" variant="heading-strong-l">
              You&apos;re between books
            </Heading>
            <Text variant="body-default-m" onBackground="neutral-medium">
              Press Start on anything in Up next to track it here.
            </Text>
          </Column>
        )}
        <GoalCard
          year={data.year}
          goal={data.goal}
          finishedThisYear={data.finishedThisYear}
          daysLeftInYear={daysLeftInYear}
          week={week}
          streak={streak}
        />
      </Row>

      {others.length > 0 && (
        <Column gap="12">
          <SectionHeader title="Also reading" />
          <AlsoReading books={others} />
        </Column>
      )}

      {data.upNext.length > 0 && (
        <Column gap="16">
          <SectionHeader title="Up next" action={{ label: "Library", href: "/library" }} />
          <CoverShelf
            books={data.upNext.map((b) => ({ ...b, caption: b.author ?? undefined }))}
            action={(book) => <StartReadingButton userBookId={book.id} title={book.title} />}
          />
        </Column>
      )}

      {data.recentlyFinished.length > 0 && (
        <Column gap="16">
          <SectionHeader
            title="Recently finished"
            action={{ label: "Year in Fineprints", href: "/wrap" }}
          />
          <RecentlyFinished books={data.recentlyFinished.slice(0, 6)} />
        </Column>
      )}
    </Column>
  );
}
