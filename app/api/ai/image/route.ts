import { put } from "@vercel/blob";
import { ipAddress } from "@vercel/functions";
import { google } from "@ai-sdk/google";
import { generateImage } from "ai";
import { generateUUID } from "@/lib/utils";
import { z } from "zod";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { imageModel } from "@/lib/ai/models";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const bodySchema = z.object({
  prompt: z.string().min(1).max(4000),
  aspectRatio: z
    .enum(["1:1", "3:4", "4:3", "9:16", "16:9"])
    .optional(),
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

  try {
    const { image } = await generateImage({
      model: google.image(imageModel.id),
      prompt: body.prompt,
      ...(body.aspectRatio && { aspectRatio: body.aspectRatio }),
    });

    const mediaType = image.mediaType ?? "image/png";
    const extension = mediaType.split("/")[1] ?? "png";
    const filename = `ai-image/${generateUUID()}.${extension}`;

    const blob = await put(filename, Buffer.from(image.uint8Array), {
      access: "public",
      contentType: mediaType,
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("ai.image error:", error);
    return new ChatbotError("offline:chat").toResponse();
  }
}
