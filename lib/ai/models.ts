export const DEFAULT_CHAT_MODEL = "gemini-2.5-flash-lite";

export const titleModel = {
  id: "gemini-2.5-flash-lite",
  name: "Gemini 2.5 Flash Lite",
  provider: "google",
  description: "Fast model for title generation",
};

// Image generation model (Nano Banana). Not in chatModels — invoke directly
// from artifact / image-gen code paths via google(imageModel.id).
export const imageModel = {
  id: "gemini-2.5-flash-image",
  name: "Gemini 2.5 Flash Image",
  provider: "google",
  description: "Image generation and editing",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

export const chatModels: ChatModel[] = [
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Fast multimodal model with vision and tool use",
  },
];

const STATIC_CAPABILITIES: Record<string, ModelCapabilities> = {
  "gemini-2.5-flash-lite": { tools: true, vision: true, reasoning: false },
};

export function getCapabilities(): Promise<Record<string, ModelCapabilities>> {
  return Promise.resolve(STATIC_CAPABILITIES);
}

export const isDemo = process.env.IS_DEMO === "1";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export function getAllGatewayModels(): Promise<GatewayModelWithCapabilities[]> {
  return Promise.resolve(
    chatModels.map((m) => ({
      ...m,
      capabilities: STATIC_CAPABILITIES[m.id] ?? {
        tools: false,
        vision: false,
        reasoning: false,
      },
    }))
  );
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
