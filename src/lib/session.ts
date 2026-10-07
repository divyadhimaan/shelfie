import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";

/** The current session, looked up once per request even when the layout and page both ask. */
export const getSession = cache(() => auth());

/** Returns the signed-in user, or sends the visitor to sign in and come back to `returnTo`. */
export async function requireUser(returnTo = "/library") {
  const session = await getSession();
  const id = session?.user?.id;
  if (!session?.user || !id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return { ...session.user, id };
}
