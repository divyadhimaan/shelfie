import { Column, Row, Text } from "@once-ui-system/core";
import styles from "./ColumnChart.module.scss";

export type ColumnDatum = {
  label: string;
  value: number;
  /** Extra line in the tooltip, e.g. "732 pages" */
  detail?: string;
};

type ColumnChartProps = {
  data: ColumnDatum[];
  /** Singular unit for the value, e.g. "book" */
  unit: string;
};

/** Whole-number tick step: 1 up to 5, then 1/2/5 × 10^k so there are about four gridlines. */
export function tickStep(max: number) {
  if (max <= 5) return 1;
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw);
  return step ?? 10 * magnitude;
}

/** A single-series column chart for counts: integer gridlines, thin bars, tooltip on hover and focus. */
export function ColumnChart({ data, unit }: ColumnChartProps) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const step = tickStep(max);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const plural = (n: number) => `${n} ${n === 1 ? unit : `${unit}s`}`;

  return (
    <Row fillWidth gap="8">
      {/* Y axis labels */}
      <Column className={styles.plot} style={{ width: "2rem" }} aria-hidden>
        {ticks.map((tick) => (
          <Text
            key={tick}
            variant="label-default-xs"
            onBackground="neutral-weak"
            style={{
              position: "absolute",
              right: 0,
              bottom: `${(tick / top) * 100}%`,
              transform: "translateY(50%)",
            }}
          >
            {tick}
          </Text>
        ))}
      </Column>

      <Column fillWidth gap="8">
        <div className={styles.plot}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className={styles.gridline}
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}
          <div className={styles.columns} role="list">
            {data.map((d) => {
              const height = `${(d.value / top) * 100}%`;
              return (
                <div
                  key={d.label}
                  role="listitem"
                  tabIndex={0}
                  className={styles.column}
                  aria-label={`${d.label}: ${plural(d.value)}${d.detail ? `, ${d.detail}` : ""}`}
                  style={{ "--bar-height": height } as React.CSSProperties}
                >
                  {d.value > 0 && <span className={styles.bar} style={{ height }} />}
                  <Column
                    className={styles.tooltip}
                    background="surface"
                    border="neutral-alpha-medium"
                    radius="m"
                    paddingX="12"
                    paddingY="8"
                    gap="2"
                    aria-hidden
                  >
                    <Text variant="label-strong-s" onBackground="neutral-strong">
                      {plural(d.value)}
                    </Text>
                    <Text variant="label-default-xs" onBackground="neutral-weak">
                      {d.label}
                      {d.detail ? ` · ${d.detail}` : ""}
                    </Text>
                  </Column>
                </div>
              );
            })}
          </div>
        </div>
        {/* X axis labels */}
        <Row fillWidth gap="2" aria-hidden>
          {data.map((d) => (
            <Text
              key={d.label}
              variant="label-default-xs"
              onBackground="neutral-weak"
              align="center"
              style={{ flex: 1, minWidth: 0 }}
            >
              {d.label}
            </Text>
          ))}
        </Row>
      </Column>
    </Row>
  );
}
