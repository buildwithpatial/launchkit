import "server-only";

import { createHmac } from "node:crypto";
import Razorpay from "razorpay";

let cached: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (cached) {
    return cached;
  }
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!(key_id && key_secret)) {
    throw new Error(
      "Razorpay keys missing — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
    );
  }
  cached = new Razorpay({ key_id, key_secret });
  return cached;
}

export function verifyCheckoutSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET missing");
  }
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET missing");
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export const DEMO_PRODUCT = {
  id: "launchkit_demo",
  amount: 100,
  currency: "INR",
  description: "Launchkit demo payment",
} as const;
