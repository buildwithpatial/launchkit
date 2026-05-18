"use client";

import { useFormStatus } from "react-dom";
import { LoaderIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-disabled={pending}
      className="relative pr-8"
      disabled={pending}
      size="sm"
      type={pending ? "button" : "submit"}
      variant="ghost"
    >
      Sign out
      {pending && (
        <span className="absolute right-2 animate-spin">
          <LoaderIcon size={12} />
        </span>
      )}
      <output aria-live="polite" className="sr-only">
        {pending ? "Signing out" : "Sign out"}
      </output>
    </Button>
  );
}
