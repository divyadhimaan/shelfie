import { PagePlaceholder } from "@/components/shell";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.stats.title };

export default function StatsPage() {
  return (
    <PagePlaceholder
      title="Reading stats"
      description="Books and pages by year and month, your rating habits, top genres and top authors."
      requirements={["STA-1", "STA-3", "STA-7"]}
    />
  );
}
