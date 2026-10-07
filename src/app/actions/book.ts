"use server";

import { revalidatePath } from "next/cache";
import { saveBookEdit } from "@/lib/library/book";
import { type EditErrors, parseBookEdit } from "@/lib/library/edit";
import { requireUser } from "@/lib/session";

export type BookEditState = { ok: boolean; message: string; errors?: EditErrors } | null;

export async function updateBook(
  userBookId: string,
  _prev: BookEditState,
  formData: FormData,
): Promise<BookEditState> {
  const user = await requireUser(`/library/${userBookId}`);
  const input = Object.fromEntries(
    ["status", "rating", "startedAt", "finishedAt", "review", "favourite", "hidden"].map((key) => [
      key,
      formData.get(key)?.toString(),
    ]),
  );

  const parsed = parseBookEdit(input);
  if (!parsed.ok)
    return { ok: false, message: "Check the highlighted fields.", errors: parsed.errors };

  const saved = await saveBookEdit(user.id, userBookId, parsed.data);
  if (!saved) return { ok: false, message: "That book isn't in your library." };

  // Library, stats and wrap all read from this book.
  revalidatePath("/library");
  revalidatePath(`/library/${userBookId}`);
  revalidatePath("/stats");
  revalidatePath("/wrap");
  return { ok: true, message: "Saved." };
}
