import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Returns the signed-in user, or sends the visitor to sign in and come back to `returnTo`. */
export async function requireUser(returnTo = "/library") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return session.user;
}
