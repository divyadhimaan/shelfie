"use client";

import { SegmentedControl } from "@once-ui-system/core";
import { useRouter } from "next/navigation";

type YearFilterProps = {
  years: number[];
  selected: number | "all";
  /** Page the picker navigates on, e.g. "/stats" */
  basePath?: string;
  /** Offer an "All time" option */
  allowAll?: boolean;
};

/** Year picker in one row above the content it filters; "all" means all time (STA-7). */
export function YearFilter({
  years,
  selected,
  basePath = "/stats",
  allowAll = true,
}: YearFilterProps) {
  const router = useRouter();
  return (
    <SegmentedControl
      fillWidth={false}
      value={String(selected)}
      onChange={(value) => router.push(`${basePath}?year=${value}`)}
      buttons={[
        ...years.map((year) => ({ value: String(year), label: String(year) })),
        ...(allowAll ? [{ value: "all", label: "All time" }] : []),
      ]}
    />
  );
}
