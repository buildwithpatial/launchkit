import { ipAddress } from "@vercel/functions";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const bodySchema = z.object({
  prompt: z.string().min(1).max(20_000),
  system: z.string().max(20_000).optional(),
  images: z.array(z.string().url()).max(8).optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  await checkIpRateLimit(ipAddress(request));

  const userType: UserType = session.user.type;
  const messageCount = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: 1,
  });
  if (messageCount > entitlementsByUserType[userType].maxMessagesPerHour) {
    return new ChatbotError("rate_limit:chat").toResponse();
  }

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: body.images?.length
        ? [
            { type: "text", text: body.prompt },
            ...body.images.map((url) => ({
              type: "image" as const,
              image: new URL(url),
            })),
          ]
        : body.prompt,
    },
  ];

  try {
    const { text } = await generateText({
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      system: body.system,
      messages,
    });
    return Response.json({ text });
  } catch (error) {
    console.error("ai.text error:", error);
    return new ChatbotError("offline:chat").toResponse();
  }
}
