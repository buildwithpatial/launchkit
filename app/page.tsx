import Link from "next/link";
import { Suspense } from "react";
import {
  HomeNavAuth,
  HomeNavAuthFallback,
} from "@/components/launchkit/home-nav-auth";
import { ImageDemo } from "@/components/launchkit/image-demo";
import { TextDemo } from "@/components/launchkit/text-demo";
import { Button } from "@/components/ui/button";

const demos = [
  {
    title: "Text",
    description: "Generate or stream text with `ai.streamText`.",
    snippet: `for await (const chunk of ai.streamText({\n  prompt: "Write a haiku about cats.",\n})) {\n  process.stdout.write(chunk);\n}`,
    body: <TextDemo />,
  },
  {
    title: "Image",
    description: "Generate images with `ai.generateImage`. Returns a hosted URL.",
    snippet: `const { url } = await ai.generateImage({\n  prompt: "A neon sign reading launchkit",\n  aspectRatio: "1:1",\n});`,
    body: <ImageDemo />,
  },
];

export default function Page() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-12 px-6 py-10">
      <nav className="flex items-center justify-between">
        <Link className="text-sm font-medium" href="/">
          launchkit
        </Link>
        <div className="flex items-center gap-2">
          <Suspense fallback={<HomeNavAuthFallback />}>
            <HomeNavAuth />
          </Suspense>
        </div>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">launchkit</h1>
        <p className="max-w-2xl text-muted-foreground">
          A reusable Next.js starter with auth, guest mode, payments, and a
          typed AI client. Below: live examples calling the same endpoints
          your downstream apps will hit.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        {demos.map((demo) => (
          <article
            className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/50 bg-card p-6"
            key={demo.title}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium">{demo.title}</h2>
              <p className="text-sm text-muted-foreground">{demo.description}</p>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border/50 bg-muted/40 p-3 text-xs leading-relaxed">
              {demo.snippet}
            </pre>
            {demo.body}
          </article>
        ))}

        <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/50 bg-card p-6 lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">Chat</h2>
            <p className="text-sm text-muted-foreground">
              The full chat surface — model picker, history, attachments,
              artifacts. Sessions persist for signed-in users; guests get a
              throwaway session.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border/50 bg-muted/40 p-3 text-xs leading-relaxed">
            {`// Lives at /chat — uses the same providers under the hood.\nimport { getLanguageModel } from "@/lib/ai/providers";`}
          </pre>
          <Button asChild className="self-start" size="sm">
            <Link href="/chat">Open chat →</Link>
          </Button>
        </article>
      </section>
    </div>
  );
}
