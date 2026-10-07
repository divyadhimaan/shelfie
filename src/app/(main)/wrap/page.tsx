import { Button, Column, Heading, Row, Text } from "@once-ui-system/core";
import { YearFilter } from "@/components/stats";
import { WrapViewer } from "@/components/wrap";
import { requireUser } from "@/lib/session";
import { displayName, getWrap, wrapVersion } from "@/lib/wrap/data";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.wrap.title };

type WrapPageProps = { searchParams: Promise<{ year?: string }> };

export default async function WrapPage({ searchParams }: WrapPageProps) {
  const user = await requireUser("/wrap");
  const { year: yearParam } = await searchParams;
  const requested = Number(yearParam) || new Date().getFullYear();

  let { years, cards } = await getWrap(user.id, requested, displayName(user));
  let year = requested;
  // Fall back to the latest year with books when the requested one has none.
  if (cards.length === 0 && years.length > 0 && !years.includes(requested)) {
    year = years[0];
    ({ cards } = await getWrap(user.id, year, displayName(user)));
  }

  return (
    <Column maxWidth="m" gap="24" paddingY="48" s={{ paddingY: "24" }}>
      <Column gap="12">
        <Heading as="h1" variant="display-strong-s">
          Year Shelfie
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak" wrap="balance">
          Your reading year as story cards, ready for Instagram. Tap or swipe through, then download
          or share.
        </Text>
        {years.length > 1 && (
          <Row fillWidth style={{ overflowX: "auto" }}>
            <YearFilter years={years} selected={year} basePath="/wrap" allowAll={false} />
          </Row>
        )}
      </Column>

      {cards.length === 0 ? (
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
            Your Year Shelfie appears once you&apos;ve finished a book with a date.
          </Text>
          <Button href="/import" prefixIcon="upload" size="m">
            Import from Goodreads
          </Button>
        </Column>
      ) : (
        <WrapViewer
          key={year}
          year={year}
          version={wrapVersion(cards)}
          cards={cards.map((c) => c.kind)}
        />
      )}
    </Column>
  );
}
