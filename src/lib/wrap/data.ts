import "server-only";

import { createHash } from "node:crypto";
import { getFinishedReads } from "@/lib/stats/queries";
import { yearsWithReads } from "@/lib/stats/compute";
import { buildWrap } from "./build";

/** The user's wrap for one year. Hidden books are left out because cards are made to be shared. */
export async function getWrap(userId: string, year: number, name: string | null) {
  const reads = await getFinishedReads(userId, { excludeHidden: true });
  return { years: yearsWithReads(reads), cards: buildWrap(reads, year, name) };
}

/** First name only on cards; never the email address. */
export function displayName(user: { name?: string | null }) {
  return user.name?.trim().split(/\s+/)[0] || null;
}

/** Short fingerprint of the cards' contents; card URLs carry it so caches refresh when the data changes. */
export function wrapVersion(cards: unknown[]) {
  return createHash("sha256").update(JSON.stringify(cards)).digest("hex").slice(0, 10);
}
