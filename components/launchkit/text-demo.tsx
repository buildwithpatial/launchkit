"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ai, LaunchkitAIError } from "@/lib/launchkit/ai";

export function TextDemo() {
  const [prompt, setPrompt] = useState("Write a haiku about lazy cats.");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setOutput("");
    try {
      let buffer = "";
      for await (const chunk of ai.streamText({ prompt })) {
        buffer += chunk;
        setOutput(buffer);
      }
    } catch (e) {
      setError(
        e instanceof LaunchkitAIError ? e.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        className="min-h-20"
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything..."
        value={prompt}
      />
      <Button
        className="self-start"
        disabled={isLoading || !prompt.trim()}
        onClick={handleGenerate}
        size="sm"
      >
        {isLoading ? "Generating..." : "Generate"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {output && (
        <pre className="whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
          {output}
        </pre>
      )}
    </div>
  );
}
