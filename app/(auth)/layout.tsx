import { XIcon } from "lucide-react";
import Link from "next/link";
import { SparklesIcon } from "@/components/chat/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background p-8 md:p-16">
      <Link
        aria-label="Close"
        className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:right-6 md:top-6"
        href="/"
      >
        <XIcon className="size-4" />
      </Link>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10">
        <div className="flex flex-col gap-2">
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
            <SparklesIcon size={14} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
