import { auth } from "@/app/(auth)/auth";
import { createPayment } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { DEMO_PRODUCT, getRazorpay } from "@/lib/razorpay";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.type === "guest") {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  try {
    const order = await getRazorpay().orders.create({
      amount: DEMO_PRODUCT.amount,
      currency: DEMO_PRODUCT.currency,
      receipt: `lk_${Date.now()}`,
      notes: { userId: session.user.id, productId: DEMO_PRODUCT.id },
    });

    await createPayment({
      userId: session.user.id,
      razorpayOrderId: order.id,
      amount: DEMO_PRODUCT.amount,
      currency: DEMO_PRODUCT.currency,
      productId: DEMO_PRODUCT.id,
    });

    return Response.json({
      orderId: order.id,
      amount: DEMO_PRODUCT.amount,
      currency: DEMO_PRODUCT.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      description: DEMO_PRODUCT.description,
    });
  } catch (error) {
    console.error("payments.order error:", error);
    return new ChatbotError("offline:api").toResponse();
  }
}
