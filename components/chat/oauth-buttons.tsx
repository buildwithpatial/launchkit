"use client";

import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { LogoGoogle } from "./icons";

export function OAuthButtons({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Button
          className="h-10 w-full justify-center gap-2 rounded-lg"
          onClick={() => signIn("google", { callbackUrl })}
          type="button"
          variant="outline"
        >
          <LogoGoogle size={16} />
          Continue with Google
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-muted-foreground uppercase tracking-wide">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
