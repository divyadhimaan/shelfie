import { Row } from "@once-ui-system/core";

type ProgressTrackProps = { percent: number; label: string; height?: 4 | 6 | 8 };

/** Thin amber progress bar on a muted track. */
export function ProgressTrack({ percent, label, height = 4 }: ProgressTrackProps) {
  return (
    <Row
      fillWidth
      radius="full"
      style={{ height: `${height}px` }}
      background="neutral-alpha-medium"
      overflow="hidden"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <Row fillHeight radius="full" solid="brand-strong" style={{ width: `${percent}%` }} />
    </Row>
  );
}
