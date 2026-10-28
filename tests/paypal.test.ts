import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureOrder, createOrder } from "../lib/paypal";

beforeEach(() => {
  process.env.PAYPAL_CLIENT_ID = "sandbox-client";
  process.env.PAYPAL_CLIENT_SECRET = "sandbox-secret";
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.PAYPAL_CLIENT_ID;
  delete process.env.PAYPAL_CLIENT_SECRET;
});

function auth() { return new Response(JSON.stringify({ access_token: "sandbox-token" }), { status: 200 }); }

describe("PayPal Sandbox integration", () => {
  it("creates orders with an exact server-supplied amount and idempotency key", async () => {
    const calls: { url: string; options: RequestInit }[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      calls.push({ url: String(url), options: options as RequestInit });
      return String(url).endsWith("/token") ? auth() : new Response(JSON.stringify({ id: "ORDER123456" }), { status: 201 });
    });
    expect(await createOrder("Aurora 75", 7900, "signed-quote")).toBe("ORDER123456");
    expect(calls[1].url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
    const body = JSON.parse(String(calls[1].options.body));
    expect(body.purchase_units[0].amount.value).toBe("79.00");
    expect(new Headers(calls[1].options.headers).has("PayPal-Request-Id")).toBe(true);
  });

  it("refuses to capture a PayPal order with a mismatched amount", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/token")) return auth();
      return new Response(JSON.stringify({ status: "APPROVED", purchase_units: [{ amount: { currency_code: "USD", value: "89.00" } }] }), { status: 200 });
    });
    await expect(captureOrder("ORDER123456", 7900)).rejects.toThrow("does not match approved quote");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("captures an approved matching order and returns an actual capture ID", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlString = String(url);
      if (urlString.endsWith("/token")) return auth();
      if (urlString.endsWith("/capture")) return new Response(JSON.stringify({ status: "COMPLETED", purchase_units: [{ payments: { captures: [{ id: "CAPTURE123456", status: "COMPLETED" }] } }] }), { status: 201 });
      return new Response(JSON.stringify({ status: "APPROVED", purchase_units: [{ amount: { currency_code: "USD", value: "79.00" } }] }), { status: 200 });
    });
    expect(await captureOrder("ORDER123456", 7900)).toEqual({ status: "COMPLETED", orderId: "ORDER123456", captureId: "CAPTURE123456" });
  });
});
