import { Button, Card, Column, Heading, Input, Line, Row, Text } from "@once-ui-system/core";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { signInWithEmail, signInWithGoogle } from "@/app/actions/auth";

export const metadata = { title: "Sign in · Shelfie" };

const errorMessages: Record<string, string> = {
  EmailRequired: "Enter your email address.",
  OAuthAccountNotLinked: "That email already signed in another way. Use the same method as before.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl = "/library", error } = await searchParams;
  const session = await auth();
  if (session?.user)
    redirect(
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/library",
    );

  const errorMessage = error ? (errorMessages[error] ?? "Sign-in failed. Please try again.") : null;

  return (
    <Column fillWidth horizontal="center" paddingY="80" s={{ paddingY: "32" }}>
      <Column maxWidth={26}>
        <Card
          direction="column"
          fillWidth
          padding="32"
          gap="24"
          radius="xl"
          border="neutral-alpha-medium"
          s={{ padding: "24" }}
        >
          <Column gap="8">
            <Heading as="h1" variant="display-strong-xs">
              Sign in to Shelfie
            </Heading>
            <Text variant="body-default-m" onBackground="neutral-weak">
              Import your Goodreads history and start your Year Shelfie.
            </Text>
          </Column>

          {errorMessage && (
            <Text role="alert" variant="body-default-s" onBackground="danger-medium">
              {errorMessage}
            </Text>
          )}

          {googleEnabled && (
            <>
              <form action={signInWithGoogle}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button type="submit" variant="secondary" size="l" fillWidth>
                  Continue with Google
                </Button>
              </form>
              <Row vertical="center" gap="12">
                <Line />
                <Text variant="label-default-s" onBackground="neutral-weak">
                  or
                </Text>
                <Line />
              </Row>
            </>
          )}

          <form action={signInWithEmail}>
            <Column gap="12">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                autoComplete="email"
                required
              />
              <Button type="submit" size="l" fillWidth>
                Email me a sign-in link
              </Button>
            </Column>
          </form>
        </Card>
      </Column>
    </Column>
  );
}
