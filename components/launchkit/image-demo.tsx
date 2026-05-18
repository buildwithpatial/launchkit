"use client";

import Image from "next/image";
import { useState } from "react";
import { ai, LaunchkitAIError } from "@/lib/launchkit/ai";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

export function ImageDemo() {
  const [prompt, setPrompt] = useState(
    "A vintage neon sign that reads 'launchkit', glowing in a foggy alley."
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const { url } = await ai.generateImage({ prompt, aspectRatio });
      setImageUrl(url);
    } catch (e) {
      setError(e instanceof LaunchkitAIError ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        className="min-h-20"
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe an image..."
        value={prompt}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(v) => setAspectRatio(v as AspectRatio)}
          value={aspectRatio}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={isLoading || !prompt.trim()}
          onClick={handleGenerate}
          size="sm"
        >
          {isLoading ? "Generating..." : "Generate"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {imageUrl && (
        <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/30">
          <Image
            alt="Generated image"
            className="h-auto w-full"
            height={1024}
            src={imageUrl}
            unoptimized
            width={1024}
          />
        </div>
      )}
    </div>
  );
}
