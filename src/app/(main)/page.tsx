import { ReadingHome } from "@/components/home";
import { Landing } from "@/components/landing";
import { addDays, currentStreak, pagesByDay, thisWeek } from "@/lib/reading/activity";
import { getActivity } from "@/lib/reading/activity-data";
import { getHomeData } from "@/lib/reading/home";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return <Landing />;

  const [data, activity] = await Promise.all([getHomeData(userId), getActivity(userId)]);
  const days = pagesByDay(activity.events);
  const yearEnd = `${activity.today.slice(0, 4)}-12-31`;
  const daysLeftInYear =
    Math.round((Date.parse(yearEnd) - Date.parse(addDays(activity.today, 0))) / 86_400_000) + 1;

  return (
    <ReadingHome
      data={data}
      name={session.user?.name ?? null}
      week={thisWeek(days, activity.today)}
      streak={currentStreak(days, activity.today)}
      daysLeftInYear={daysLeftInYear}
    />
  );
}
