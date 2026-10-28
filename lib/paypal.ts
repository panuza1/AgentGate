import { createHash } from "node:crypto";

const root = "https://api-m.sandbox.paypal.com";

function credentials() {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new Error("PayPal Sandbox credentials are not configured");
  return { id: PAYPAL_CLIENT_ID, secret: PAYPAL_CLIENT_SECRET };
}

async function token() {
  const { id, secret } = credentials();
  const response = await fetch(`${root}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`PayPal authentication failed (${response.status})`);
  const result = await response.json();
  if (typeof result.access_token !== "string") throw new Error("PayPal access token is missing");
  return result.access_token as string;
}

async function paypalFetch(path: string, method: "GET" | "POST", payload?: unknown, requestId?: string) {
  const auth = await token();
  const response = await fetch(`${root}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PayPal ${method} request failed (${response.status}; ${data.name || "unknown"})`);
  return data;
}

export async function createOrder(productName: string, cents: number, quoteToken: string) {
  const requestId = createHash("sha256").update(`order:${quoteToken}`).digest("hex").slice(0, 32);
  const data = await paypalFetch("/v2/checkout/orders", "POST", {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: "agentgate-demo",
      description: "AgentGate fictional merchant sandbox checkout",
      items: [{ name: productName, quantity: "1", unit_amount: { currency_code: "USD", value: (cents / 100).toFixed(2) }, category: "PHYSICAL_GOODS" }],
      amount: { currency_code: "USD", value: (cents / 100).toFixed(2), breakdown: { item_total: { currency_code: "USD", value: (cents / 100).toFixed(2) } } },
    }],
  }, requestId);
  if (typeof data.id !== "string") throw new Error("PayPal order ID missing");
  return data.id as string;
}

export async function captureOrder(orderId: string, expectedCents: number) {
  const current = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, "GET");
  const value = current.purchase_units?.[0]?.amount?.value;
  if (current.purchase_units?.length !== 1 || current.purchase_units[0]?.amount?.currency_code !== "USD" || value !== (expectedCents / 100).toFixed(2)) {
    throw new Error("PayPal order amount does not match approved quote");
  }
  if (current.status !== "APPROVED" && current.status !== "COMPLETED") {
    throw new Error(`PayPal order is not approved (${current.status || "unknown"})`);
  }
  if (current.status === "COMPLETED") {
    const capture = current.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== "COMPLETED") throw new Error("Unable to verify payment capture");
    return { status: "COMPLETED", captureId: capture.id as string, orderId };
  }
  const requestId = createHash("sha256").update(`capture:${orderId}`).digest("hex").slice(0, 32);
  const data = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, "POST", undefined, requestId);
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (data.status !== "COMPLETED" || capture?.status !== "COMPLETED" || typeof capture.id !== "string") {
    throw new Error("PayPal payment was not completed");
  }
  return { status: "COMPLETED", captureId: capture.id as string, orderId };
}
