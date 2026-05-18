import { getPaymentByOrderId, updatePaymentStatus } from "@/lib/db/queries";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature({ rawBody, signature })) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: {
    event: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!orderId) {
    return new Response("ok", { status: 200 });
  }

  const row = await getPaymentByOrderId(orderId);
  if (!row) {
    return new Response("ok", { status: 200 });
  }

  if (event.event === "payment.captured" && row.status !== "paid") {
    await updatePaymentStatus({
      razorpayOrderId: orderId,
      status: "paid",
      razorpayPaymentId: paymentId,
    });
  } else if (event.event === "payment.failed" && row.status === "created") {
    await updatePaymentStatus({
      razorpayOrderId: orderId,
      status: "failed",
      razorpayPaymentId: paymentId,
    });
  }

  return new Response("ok", { status: 200 });
}
