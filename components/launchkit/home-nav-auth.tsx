import Form from "next/form";
import Link from "next/link";
import { auth, signOut } from "@/app/(auth)/auth";
import { SignOutButton } from "@/components/launchkit/sign-out-button";
import { Button } from "@/components/ui/button";
import { guestRegex } from "@/lib/constants";

export async function HomeNavAuth() {
  const session = await auth();
  const isAuthenticated =
    !!session?.user && !guestRegex.test(session.user.email ?? "");

  if (isAuthenticated) {
    return (
      <>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session.user.email}
        </span>
        <Form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <SignOutButton />
        </Form>
      </>
    );
  }

  return (
    <>
      <Button asChild size="sm" variant="ghost">
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/register">Sign up</Link>
      </Button>
    </>
  );
}

export function HomeNavAuthFallback() {
  return <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />;
}
