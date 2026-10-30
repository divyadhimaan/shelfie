import { Avatar, Button, Column, Grid, Heading, Row, Text } from "@once-ui-system/core";
import { RecentlyFinished, SectionHeader } from "@/components/home";
import { ReadingHeatmap } from "@/components/profile";
import { StatTile } from "@/components/stats";
import { currentStreak, heatmap, longestStreak, pagesByDay } from "@/lib/reading/activity";
import { getActivity } from "@/lib/reading/activity-data";
import { getHomeData } from "@/lib/reading/home";
import { requireUser } from "@/lib/session";
import { computeStats } from "@/lib/stats/compute";
import { getFinishedReads } from "@/lib/stats/queries";

export const metadata = { title: "Profile · Fineprints" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [activity, reads, home] = await Promise.all([
    getActivity(user.id),
    getFinishedReads(user.id),
    getHomeData(user.id),
  ]);

  const days = pagesByDay(activity.events);
  const weeks = heatmap(days, activity.today, 52);
  const lastYearDays = weeks.flat().filter((d) => d.level > 0).length;
  const year = Number(activity.today.slice(0, 4));
  const stats = computeStats(reads, year);
  const name = user.name?.trim() || user.email?.split("@")[0] || "Reader";
  const firstYear = reads
    .map((r) => r.finishedAt?.slice(0, 4))
    .filter(Boolean)
    .sort()[0];

  return (
    <Column maxWidth="l" gap="32" paddingY="40" s={{ paddingY: "24" }}>
      <Row gap="20" vertical="center" wrap>
        <Avatar size="xl" src={user.image ?? undefined} value={name.charAt(0).toUpperCase()} />
        <Column gap="4" flex={1} style={{ minWidth: "12rem" }}>
          <Heading as="h1" variant="display-default-s">
            {name}
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-weak">
            {firstYear ? `Reading on Fineprints since ${firstYear}` : "New on Fineprints"} ·{" "}
            {home.libraryCount} books in your library
          </Text>
        </Column>
        <Button href="/settings" variant="secondary" size="m" prefixIcon="settings">
          Settings
        </Button>
      </Row>

      <Grid columns="4" gap="12" m={{ columns: 2 }}>
        <StatTile
          label={`Books in ${year}`}
          value={stats.booksRead.toLocaleString("en")}
          note={home.goal ? `Goal: ${home.goal.target}` : undefined}
        />
        <StatTile label={`Pages in ${year}`} value={stats.pagesRead.toLocaleString("en")} />
        <StatTile label="Current streak" value={`${currentStreak(days, activity.today)} days`} />
        <StatTile label="Longest streak" value={`${longestStreak(days)} days`} />
      </Grid>

      <Column
        gap="16"
        padding="24"
        radius="xl"
        background="surface"
        border="neutral-alpha-weak"
        s={{ padding: "16" }}
      >
        <Row horizontal="between" vertical="end" gap="12" wrap>
          <Heading as="h2" variant="heading-default-xl">
            Days you read
          </Heading>
          <Text variant="label-default-s" onBackground="neutral-weak">
            {lastYearDays} days in the last 52 weeks
          </Text>
        </Row>
        <ReadingHeatmap weeks={weeks} readingDays={lastYearDays} />
      </Column>

      {home.recentlyFinished.length > 0 && (
        <Column gap="16">
          <SectionHeader
            title="Recently finished"
            action={{ label: "All stats", href: "/stats" }}
          />
          <RecentlyFinished books={home.recentlyFinished.slice(0, 6)} />
        </Column>
      )}
    </Column>
  );
}
