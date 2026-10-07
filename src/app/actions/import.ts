"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { GoodreadsFormatError } from "@/lib/goodreads/parse";
import {
  type ImportProgress,
  MAX_FILE_BYTES,
  type MissingDateRule,
  commitImport,
  createImport,
  discardImport,
  processImportBatch,
} from "@/lib/import/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function uploadGoodreadsCsv(
  formData: FormData,
): Promise<Result<{ importId: string }>> {
  const user = await requireUser("/import");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Choose your Goodreads CSV file." };
  if (file.size > MAX_FILE_BYTES)
    return { ok: false, error: "That file is over 4 MB. Is it the Goodreads export?" };
  if (!file.name.toLowerCase().endsWith(".csv"))
    return { ok: false, error: "The Goodreads export is a .csv file." };

  try {
    const importId = await createImport(user.id, file.name, await file.text());
    revalidatePath("/import");
    return { ok: true, data: { importId } };
  } catch (error) {
    if (error instanceof GoodreadsFormatError) return { ok: false, error: error.message };
    console.error("[import] upload failed", error);
    return { ok: false, error: "Couldn't read that file. Please try again." };
  }
}

export async function continueMatching(importId: string): Promise<Result<ImportProgress>> {
  const user = await requireUser("/import");
  try {
    return { ok: true, data: await processImportBatch(user.id, importId) };
  } catch (error) {
    console.error("[import] matching failed", error);
    return { ok: false, error: "Matching stopped unexpectedly. Reload to continue." };
  }
}

export async function saveImport(
  importId: string,
  rule: MissingDateRule,
): Promise<Result<{ added: number; skipped: number }>> {
  const user = await requireUser("/import");
  try {
    const data = await commitImport(
      user.id,
      importId,
      rule === "undated" ? "undated" : "date_added",
    );
    revalidatePath("/import");
    revalidatePath("/library");
    return { ok: true, data };
  } catch (error) {
    console.error("[import] save failed", error);
    return { ok: false, error: "Couldn't save the import. Please try again." };
  }
}

export async function cancelImport(importId: string): Promise<Result<null>> {
  const user = await requireUser("/import");
  await discardImport(user.id, importId);
  revalidatePath("/import");
  return { ok: true, data: null };
}
