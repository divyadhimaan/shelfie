"use client";

import { useState } from "react";
import styles from "./StarRating.module.scss";

const STAR = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z";

type StarRatingProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
};

/**
 * Half-star rating input. Click a star's left or right half; arrow keys step by half a star;
 * clicking the current rating again clears it.
 */
export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  const set = (next: number) => onChange(next === value ? null : next);

  return (
    <div
      className={styles.group}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value ?? 0}
      aria-valuetext={value ? `${value} out of 5 stars` : "Not rated"}
      onMouseLeave={() => setHover(null)}
      onKeyDown={(event) => {
        const current = value ?? 0;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          onChange(Math.min(5, current + 0.5));
        } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          onChange(current - 0.5 <= 0 ? null : current - 0.5);
        } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
          onChange(null);
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, shown - (star - 1)));
        return (
          <span key={star} className={styles.star}>
            <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
              <path d={STAR} className={styles.empty} />
              {fill > 0 && (
                <path
                  d={STAR}
                  className={styles.full}
                  style={fill < 1 ? { clipPath: "inset(0 50% 0 0)" } : undefined}
                />
              )}
            </svg>
            {[star - 0.5, star].map((v) => (
              <button
                key={v}
                type="button"
                tabIndex={-1}
                aria-hidden
                className={styles.half}
                onMouseEnter={() => setHover(v)}
                onClick={() => set(v)}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
}
