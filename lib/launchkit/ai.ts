/**
 * launchkit AI client.
 *
 * Wraps the /api/ai/* endpoints so consuming UIs can call typed methods
 * instead of raw fetch. Works in browser and on the server (route handlers,
 * server actions). Auth cookies are passed through automatically by the
 * runtime fetch.
 *
 * Usage:
 *   import { ai } from "@/lib/launchkit/ai";
 *   const { text } = await ai.generateText({ prompt: "..." });
 *   for await (const chunk of ai.streamText({ prompt: "..." })) { ... }
 *   const { url } = await ai.generateImage({ prompt: "..." });
 */

export type GenerateTextOptions = {
  prompt: string;
  system?: string;
  images?: string[];
  signal?: AbortSignal;
};

export type GenerateTextResult = {
  text: string;
};

export type GenerateImageOptions = {
  prompt: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  signal?: AbortSignal;
};

export type GenerateImageResult = {
  url: string;
};

export type LaunchkitAIOptions = {
  /** Override base URL (defaults to "" — relative path). */
  baseUrl?: string;
  /** Override fetch (defaults to global fetch). */
  fetch?: typeof fetch;
};

export class LaunchkitAIError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "LaunchkitAIError";
    this.status = status;
    this.code = code;
  }
}

export class LaunchkitAI {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LaunchkitAIOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchImpl = options.fetch ?? fetch;
  }

  async generateText(
    options: GenerateTextOptions
  ): Promise<GenerateTextResult> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/ai/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.prompt,
        system: options.system,
        images: options.images,
      }),
      signal: options.signal,
      credentials: "include",
    });

    if (!response.ok) {
      throw await this.toError(response);
    }
    return (await response.json()) as GenerateTextResult;
  }

  async *streamText(options: GenerateTextOptions): AsyncIterable<string> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/api/ai/text/stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: options.prompt,
          system: options.system,
          images: options.images,
        }),
        signal: options.signal,
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw await this.toError(response);
    }
    if (!response.body) {
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          yield decoder.decode(value, { stream: true });
        }
      }
      const tail = decoder.decode();
      if (tail) {
        yield tail;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generateImage(
    options: GenerateImageOptions
  ): Promise<GenerateImageResult> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/ai/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.prompt,
        aspectRatio: options.aspectRatio,
      }),
      signal: options.signal,
      credentials: "include",
    });

    if (!response.ok) {
      throw await this.toError(response);
    }
    return (await response.json()) as GenerateImageResult;
  }

  private async toError(response: Response): Promise<LaunchkitAIError> {
    let message = response.statusText;
    let code: string | undefined;
    try {
      const data = (await response.json()) as {
        message?: string;
        code?: string;
      };
      if (data.message) {
        message = data.message;
      }
      code = data.code;
    } catch {
      // body wasn't JSON — fall back to statusText
    }
    return new LaunchkitAIError(message, response.status, code);
  }
}

export const ai = new LaunchkitAI();
