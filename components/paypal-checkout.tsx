"use client";

import { useEffect, useRef, useState } from "react";

type PayPalSession = { start: (options: { presentationMode: "auto" }, createOrder: Promise<{ orderId: string }>) => Promise<void> };
type PayPalInstance = {
  findEligibleMethods: (options: { currencyCode: string }) => Promise<{ isEligible: (method: string) => boolean }>;
  createPayPalOneTimePaymentSession: (options: {
    onApprove: (data: { orderId: string }) => Promise<void>;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => Promise<PayPalSession>;
};

declare global {
  interface Window {
    paypal?: { createInstance: (options: { clientId: string; components: string[] }) => Promise<PayPalInstance> };
  }
}

type Receipt = { status: "COMPLETED"; orderId: string; captureId: string };

async function request<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Payment request failed");
  return result as T;
}

let sdkPromise: Promise<void> | undefined;
function sdkReady() {
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.sandbox.paypal.com/web-sdk/v6/core";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load PayPal Sandbox SDK"));
    document.head.appendChild(script);
  }).catch((error) => { sdkPromise = undefined; throw error; });
  return sdkPromise;
}

export function PayPalCheckout({ clientId, quoteToken, onComplete }: {
  clientId: string;
  quoteToken: string;
  onComplete: (receipt: Receipt) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading secure PayPal checkout…");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let element: HTMLElement | null = null;

    async function mount() {
      try {
        await sdkReady();
        if (!active || !window.paypal) return;
        const instance = await window.paypal.createInstance({ clientId, components: ["paypal-payments"] });
        const methods = await instance.findEligibleMethods({ currencyCode: "USD" });
        if (!active) return;
        if (!methods.isEligible("paypal")) throw new Error("PayPal is not available for this sandbox buyer");

        let orderProof = "";
        const session = await instance.createPayPalOneTimePaymentSession({
          onApprove: async ({ orderId }) => {
            try {
              if (!active) return;
              setStatus("Verifying and capturing the approved payment…");
              const receipt = await request<Receipt>("/api/checkout/capture", { orderId, orderProof });
              if (active) onComplete(receipt);
            } catch (err) {
              if (active) setError(err instanceof Error ? err.message : "Capture failed");
            }
          },
          onCancel: () => { if (active) setStatus("Payment cancelled. No charge was captured."); },
          onError: (err) => { if (active) setError(err.message || "PayPal checkout failed"); },
        });
        if (!active || !containerRef.current) return;
        element = document.createElement("paypal-button");
        element.addEventListener("click", () => {
          setError("");
          setStatus("Waiting for PayPal approval…");
          // Keep a synchronous start inside the click: popup blockers can reject delayed starts.
          const createOrderPromise = request<{ orderId: string; orderProof: string }>("/api/checkout/create", { quoteToken })
            .then((result) => { orderProof = result.orderProof; return { orderId: result.orderId }; });
          void session.start({ presentationMode: "auto" }, createOrderPromise)
            .catch((err: Error) => { if (active) setError(err.message || "Unable to start checkout"); });
        });
        containerRef.current.replaceChildren(element);
        setStatus("Approve the Sandbox transaction using the PayPal button.");
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "PayPal setup failed");
      }
    }

    void mount();
    return () => { active = false; if (element) element.remove(); };
  }, [clientId, quoteToken, onComplete]);

  return (
    <div className="checkout-box">
      <div ref={containerRef} className="paypal-slot" />
      <p className="micro-copy">{status}</p>
      {error && <p className="error-box" role="alert">{error}</p>}
    </div>
  );
}
