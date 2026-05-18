import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getPaymentByOrderId, updatePaymentStatus } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { verifyCheckoutSignature } from "@/lib/razorpay";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.type === "guest") {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const payment = await getPaymentByOrderId(body.razorpay_order_id);
  if (!payment || payment.userId !== session.user.id) {
    return new ChatbotError("not_found:api").toResponse();
  }

  const valid = verifyCheckoutSignature({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  });

  if (!valid) {
    await updatePaymentStatus({
      razorpayOrderId: body.razorpay_order_id,
      status: "failed",
    });
    return new ChatbotError("forbidden:api").toResponse();
  }

  if (payment.status !== "paid") {
    await updatePaymentStatus({
      razorpayOrderId: body.razorpay_order_id,
      status: "paid",
      razorpayPaymentId: body.razorpay_payment_id,
    });
  }

  return Response.json({ status: "paid" });
}
