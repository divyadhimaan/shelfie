"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { syncTimeZone } from "@/app/actions/profile";

const KEY = "shelfie:tz-synced";

/** Tells the server the reader's time zone once per tab session; refreshes if it changed. */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      if (sessionStorage.getItem(KEY) === timeZone) return;
      sessionStorage.setItem(KEY, timeZone);
    } catch {
      // Storage blocked: sync anyway; the server ignores no-op updates.
    }
    syncTimeZone(timeZone).then(({ changed }) => {
      if (changed) router.refresh();
    });
  }, [router]);

  return null;
}
