"use client";

import Script from "next/script";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type OrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
};

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccess) => void;
  prefill?: { email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

export function PaymentDemo() {
  const [status, setStatus] = useState<
    "idle" | "creating" | "checkout" | "verifying" | "paid" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const handlePay = async () => {
    setError(null);
    setStatus("creating");

    let order: OrderResponse;
    try {
      const res = await fetch("/api/payments/order", { method: "POST" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sign in to make a payment.");
        }
        throw new Error("Could not create order.");
      }
      order = (await res.json()) as OrderResponse;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to create order");
      return;
    }

    if (!(scriptReady && window.Razorpay)) {
      setStatus("error");
      setError("Razorpay checkout script not loaded yet.");
      return;
    }

    setStatus("checkout");
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "launchkit",
      description: order.description,
      theme: { color: "#000000" },
      modal: {
        ondismiss: () => {
          setStatus((s) => (s === "checkout" ? "idle" : s));
        },
      },
      handler: async (response) => {
        setStatus("verifying");
        try {
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!verify.ok) {
            throw new Error("Signature verification failed.");
          }
          setStatus("paid");
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Verification failed");
        }
      },
    });
    rzp.open();
  };

  const busy =
    status === "creating" || status === "checkout" || status === "verifying";

  return (
    <div className="flex flex-col gap-3">
      <Script
        onReady={() => setScriptReady(true)}
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
        <span className="font-medium">₹1.00</span>{" "}
        <span className="text-muted-foreground">
          one-time — Razorpay test mode
        </span>
      </div>
      <Button
        className="self-start"
        disabled={busy || status === "paid"}
        onClick={handlePay}
        size="sm"
      >
        {status === "creating" && "Creating order…"}
        {status === "checkout" && "Opening checkout…"}
        {status === "verifying" && "Verifying…"}
        {status === "paid" && "Paid ✓"}
        {(status === "idle" || status === "error") && "Pay ₹1"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {status === "paid" && (
        <p className="text-sm text-muted-foreground">
          Payment captured. Check the Payment table for the record.
        </p>
      )}
    </div>
  );
}
