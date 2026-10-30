import { Button, Column, Heading, Row, Text } from "@once-ui-system/core";
import { notFound } from "next/navigation";
import { BookHero, ReadingActions, SessionTimeline } from "@/components/book";
import { ProgressTrack } from "@/components/home";
import { BookEditor } from "@/components/library";
import { getBookDetail, getBookReading } from "@/lib/library/book";
import { todayIn, userTimeZone } from "@/lib/reading/home";
import { requireUser } from "@/lib/session";

type BookPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: BookPageProps) {
  const { id } = await params;
  const user = await requireUser(`/library/${id}`);
  const book = await getBookDetail(user.id, id);
  return { title: book ? `${book.title} · Fineprints` : "Book · Fineprints" };
}

const stars = (rating: number) => `${"★".repeat(Math.floor(rating))}${rating % 1 ? "½" : ""}`;
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;
  const user = await requireUser(`/library/${id}`);
  const [book, reading, timeZone] = await Promise.all([
    getBookDetail(user.id, id),
    getBookReading(user.id, id),
    userTimeZone(user.id),
  ]);
  if (!book) notFound();

  const status = book.edit.status;
  const facts = [
    book.firstPublishedYear ? String(book.firstPublishedYear) : null,
    book.pages ? `${book.pages.toLocaleString("en")} pages` : null,
    book.readCount > 1 ? `Read ${book.readCount} times` : null,
  ].filter((f): f is string => !!f);

  return (
    <Column maxWidth="l" gap="24" paddingY="32" s={{ paddingY: "16" }}>
      <Row>
        <Button href="/library" variant="tertiary" size="s" prefixIcon="chevronLeft">
          Library
        </Button>
      </Row>

      <BookHero
        title={book.title}
        authors={book.authors}
        coverUrl={book.coverUrl}
        facts={facts}
        genres={book.genres}
      >
        {status === "reading" && reading && (
          <Column gap="8" style={{ maxWidth: "32rem" }}>
            <ProgressTrack
              percent={reading.progress.percent}
              label={`${book.title} progress`}
              height={6}
            />
            <Row horizontal="between" gap="12" wrap>
              <Text variant="label-default-s" onBackground="neutral-medium">
                {reading.progress.page !== null && reading.progress.totalPages
                  ? `Page ${reading.progress.page} of ${reading.progress.totalPages} · ${reading.progress.percent}%`
                  : `${reading.progress.percent}%`}
              </Text>
              {reading.daysLeft !== null && (
                <Text variant="label-default-s" onBackground="neutral-medium">
                  About {reading.daysLeft} days left
                </Text>
              )}
            </Row>
          </Column>
        )}
        {status === "read" && book.edit.finishedAt && (
          <Text variant="body-default-m" onBackground="neutral-medium">
            Finished {longDate(book.edit.finishedAt)}
            {book.edit.rating ? (
              <Text onBackground="brand-weak"> · {stars(book.edit.rating)}</Text>
            ) : null}
          </Text>
        )}
        <ReadingActions
          userBookId={book.id}
          title={book.title}
          status={status}
          progress={reading?.progress ?? null}
        />
      </BookHero>

      <Row gap="24" wrap vertical="start">
        <Column
          flex={2}
          gap="16"
          padding="24"
          radius="xl"
          background="surface"
          border="neutral-alpha-weak"
          style={{ minWidth: "min(100%, 28rem)" }}
          s={{ padding: "16" }}
        >
          <Heading as="h2" variant="heading-default-xl">
            Your details
          </Heading>
          <BookEditor userBookId={book.id} initial={book.edit} />
        </Column>
        <Column
          flex={1}
          gap="8"
          padding="24"
          radius="xl"
          background="surface"
          border="neutral-alpha-weak"
          style={{ minWidth: "min(100%, 18rem)" }}
          s={{ padding: "16" }}
        >
          <Heading as="h2" variant="heading-default-xl">
            Your reading
          </Heading>
          {reading && (reading.sessions.length > 0 || reading.startedAt) ? (
            <SessionTimeline
              sessions={reading.sessions}
              startedAt={reading.startedAt}
              today={todayIn(timeZone)}
            />
          ) : (
            <Text variant="body-default-s" onBackground="neutral-weak">
              {status === "want_to_read"
                ? "Start reading to track your sessions here."
                : "No sessions logged for this read."}
            </Text>
          )}
        </Column>
      </Row>
    </Column>
  );
}
