import { ReadingHome } from "@/components/home";
import { Landing } from "@/components/landing";
import { getHomeData } from "@/lib/reading/home";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return <Landing />;

  const data = await getHomeData(userId);
  return <ReadingHome data={data} name={session.user?.name ?? null} />;
}
