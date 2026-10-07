import { PagePlaceholder } from "@/components/shell";
import { requireUser } from "@/lib/session";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.stats.title };

export default async function StatsPage() {
  await requireUser("/stats");

  return (
    <PagePlaceholder
      title="Reading stats"
      description="Books and pages by year and month, your rating habits, top genres and top authors."
      requirements={["STA-1", "STA-3", "STA-7"]}
    />
  );
}
