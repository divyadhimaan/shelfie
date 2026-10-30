"use server";

import { revalidatePath } from "next/cache";
import {
  ReadingError,
  finishBook,
  logProgress,
  setGoal,
  startReading,
} from "@/lib/reading/actions";
import { requireUser } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function run(fn: (userId: string) => Promise<unknown>): Promise<ActionResult> {
  const user = await requireUser("/");
  try {
    await fn(user.id);
  } catch (error) {
    if (error instanceof ReadingError) return { ok: false, error: error.message };
    console.error("[reading]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  // Home, library, stats and wrap all reflect reading state.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProgress(
  userBookId: string,
  value: { page?: number; percent?: number },
) {
  return run((userId) => logProgress(userId, userBookId, value));
}

export async function markFinished(userBookId: string, rating: number | null) {
  return run((userId) => finishBook(userId, userBookId, rating));
}

export async function beginReading(userBookId: string) {
  return run((userId) => startReading(userId, userBookId));
}

export async function saveGoal(target: number) {
  return run((userId) => setGoal(userId, target));
}
