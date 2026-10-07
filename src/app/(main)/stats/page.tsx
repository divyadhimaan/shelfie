import { Book, Button, Column, Grid, Heading, Row, Text } from "@once-ui-system/core";
import {
  BooksOverTime,
  RankedBars,
  RatingDistribution,
  StatTile,
  YearFilter,
} from "@/components/stats";
import { requireUser } from "@/lib/session";
import { type BookRef, computeStats, yearsWithReads } from "@/lib/stats/compute";
import { getFinishedReads } from "@/lib/stats/queries";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.stats.title };

type StatsPageProps = { searchParams: Promise<{ year?: string }> };

const number = (n: number) => n.toLocaleString("en");

function Highlight({ label, book }: { label: string; book: BookRef }) {
  return (
    <Row
      gap="16"
      vertical="center"
      padding="16"
      radius="l"
      border="neutral-alpha-weak"
      background="surface"
      fillWidth
    >
      <Book src={book.coverUrl ?? undefined} alt="" sizes={80} maxWidth={4} />
      <Column gap="4">
        <Text variant="label-default-s" onBackground="neutral-weak">
          {label}
        </Text>
        <Text variant="body-strong-m">{book.title}</Text>
        <Text variant="body-default-s" onBackground="neutral-weak">
          {[book.author, `${number(book.pages)} pages`].filter(Boolean).join(" · ")}
        </Text>
      </Column>
    </Row>
  );
}

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const user = await requireUser("/stats");
  const [{ year: yearParam }, reads] = await Promise.all([searchParams, getFinishedReads(user.id)]);

  const years = yearsWithReads(reads);
  const currentYear = new Date().getFullYear();
  const requested = yearParam === "all" ? "all" : Number(yearParam);
  const selected: number | "all" =
    requested === "all"
      ? "all"
      : years.includes(requested)
        ? requested
        : years.includes(currentYear)
          ? currentYear
          : (years[0] ?? "all");
  const stats = computeStats(reads, selected === "all" ? null : selected);
  const periodLabel = selected === "all" ? "all time" : String(selected);

  if (reads.length === 0) {
    return (
      <Column maxWidth="l" gap="24" paddingY="48" s={{ paddingY: "24" }}>
        <Heading as="h1" variant="display-strong-s">
          Reading stats
        </Heading>
        <Column
          padding="32"
          gap="12"
          radius="xl"
          border="neutral-alpha-medium"
          horizontal="center"
          align="center"
        >
          <Heading as="h2" variant="heading-strong-m">
            No finished books yet
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-weak">
            Import your Goodreads history to see your stats.
          </Text>
          <Button href="/import" prefixIcon="upload" size="m">
            Import from Goodreads
          </Button>
        </Column>
      </Column>
    );
  }

  return (
    <Column maxWidth="l" gap="24" paddingY="48" s={{ paddingY: "24" }}>
      <Column gap="16">
        <Heading as="h1" variant="display-strong-s">
          Reading stats
        </Heading>
        <Row fillWidth style={{ overflowX: "auto" }}>
          <YearFilter years={years} selected={selected} />
        </Row>
      </Column>

      <Grid columns="4" gap="12" m={{ columns: 2 }}>
        <StatTile label={`Books read · ${periodLabel}`} value={number(stats.booksRead)} />
        <StatTile
          label="Pages read"
          value={number(stats.pagesRead)}
          note={
            stats.booksMissingPages > 0
              ? `${stats.booksMissingPages} without a page count`
              : undefined
          }
        />
        <StatTile
          label="Average rating"
          value={stats.averageRating === null ? "–" : `${stats.averageRating.toFixed(2)}★`}
          note={`${stats.ratedBooks} rated`}
        />
        <StatTile
          label="Average length"
          value={stats.averageLength === null ? "–" : `${number(stats.averageLength)} pp`}
        />
      </Grid>

      <BooksOverTime
        title={selected === "all" ? "Books per year" : `Books per month in ${selected}`}
        description={
          selected === "all"
            ? "Finished books by year (undated reads are only in the totals)"
            : "Finished books by month"
        }
        periods={stats.byPeriod}
      />

      <Grid columns="3" gap="12" m={{ columns: 1 }}>
        <RatingDistribution buckets={stats.ratingDistribution} />
        <RankedBars
          title="Top genres"
          items={stats.topGenres}
          unit="book"
          emptyText="No genres yet."
        />
        <RankedBars
          title="Top authors"
          items={stats.topAuthors}
          unit="book"
          emptyText="No authors yet."
        />
      </Grid>

      {(stats.longest || stats.shortest) && (
        <Grid columns="2" gap="12" s={{ columns: 1 }}>
          {stats.longest && <Highlight label="Longest book" book={stats.longest} />}
          {stats.shortest && <Highlight label="Shortest book" book={stats.shortest} />}
        </Grid>
      )}
    </Column>
  );
}
