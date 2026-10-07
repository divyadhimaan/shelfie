"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

/** Only same-site paths are allowed as post-sign-in destinations. */
function safeCallback(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/library";
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const redirectTo = safeCallback(formData.get("callbackUrl"));
  if (!email) redirect(`/signin?error=EmailRequired&callbackUrl=${encodeURIComponent(redirectTo)}`);

  try {
    await signIn("resend", { email, redirectTo });
  } catch (error) {
    // signIn redirects by throwing; only real auth failures are handled here.
    if (error instanceof AuthError) {
      redirect(`/signin?error=${error.type}&callbackUrl=${encodeURIComponent(redirectTo)}`);
    }
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeCallback(formData.get("callbackUrl")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
