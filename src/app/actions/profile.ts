"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";

export type ProfileState = { ok: boolean; message: string } | null;

const MAX_NAME_LENGTH = 50;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser("/settings");
  const name = String(formData.get("name") ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (name.length > MAX_NAME_LENGTH)
    return { ok: false, message: `Keep it under ${MAX_NAME_LENGTH} characters.` };

  await db
    .update(users)
    .set({ name: name || null })
    .where(eq(users.id, user.id));
  // The name shows in the header and on wrap cards.
  revalidatePath("/", "layout");
  return { ok: true, message: name ? "Saved." : "Name removed." };
}
