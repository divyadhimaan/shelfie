import { Column, Text } from "@once-ui-system/core";
import { ColumnChart } from "./ColumnChart";
import type { PeriodCount } from "@/lib/stats/compute";

type BooksOverTimeProps = {
  title: string;
  description: string;
  periods: PeriodCount[];
};

/** Books finished per month (or per year for all time). One series, so one brand color and no legend. */
export function BooksOverTime({ title, description, periods }: BooksOverTimeProps) {
  return (
    <Column padding="20" radius="l" border="neutral-alpha-weak" background="surface" fillWidth>
      <Column gap="4" marginBottom="16">
        <Text as="h2" variant="heading-strong-s">
          {title}
        </Text>
        <Text variant="body-default-s" onBackground="neutral-weak">
          {description}
        </Text>
      </Column>
      <ColumnChart
        unit="book"
        data={periods.map((p) => ({
          label: p.label,
          value: p.books,
          detail: `${p.pages.toLocaleString("en")} pages`,
        }))}
      />
      <Column marginTop="16">
        <NumbersTable periods={periods} />
      </Column>
    </Column>
  );
}

export function RatingDistribution({ buckets }: { buckets: { stars: number; count: number }[] }) {
  return (
    <Column padding="20" radius="l" border="neutral-alpha-weak" background="surface" fillWidth>
      <Column gap="4" marginBottom="16">
        <Text as="h2" variant="heading-strong-s">
          How you rate
        </Text>
        <Text variant="body-default-s" onBackground="neutral-weak">
          Rated books by stars (half stars round down)
        </Text>
      </Column>
      <ColumnChart
        unit="book"
        data={buckets.map((b) => ({ label: `${b.stars}★`, value: b.count }))}
      />
    </Column>
  );
}

/** The chart's values without hovering (accessibility table view). */
function NumbersTable({ periods }: { periods: PeriodCount[] }) {
  return (
    <details>
      <summary style={{ cursor: "pointer" }}>
        <Text variant="label-default-s" onBackground="neutral-weak">
          Show the numbers
        </Text>
      </summary>
      <table style={{ marginTop: 12, borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Period", "Books", "Pages"].map((h) => (
              <th
                key={h}
                style={{ textAlign: h === "Period" ? "left" : "right", padding: "4px 8px" }}
              >
                <Text variant="label-strong-s">{h}</Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.label}>
              <td style={{ padding: "4px 8px" }}>
                <Text variant="body-default-s">{p.label}</Text>
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                <Text variant="body-default-s">{p.books}</Text>
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                <Text variant="body-default-s">{p.pages.toLocaleString("en")}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
