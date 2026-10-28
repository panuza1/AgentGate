import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { issueOrderProof, issueQuote, verifyOrderProof, verifyQuote } from "../lib/quote";
import { findProduct } from "../lib/catalog";

const policy = { maxBudgetCents: 10000, blockSubscriptions: true };
beforeEach(() => { process.env.QUOTE_SECRET = "unit-test-only-long-secret-at-least-32-characters"; });
afterEach(() => { vi.useRealTimers(); delete process.env.QUOTE_SECRET; });

describe("signed and expiring purchase approval", () => {
  it("issues and validates a fixed-price quote", () => {
    const { token } = issueQuote("key-aurora", policy);
    expect(verifyQuote(token).totalCents).toBe(7900);
  });

  it("rejects altered approval tokens", () => {
    const { token } = issueQuote("key-aurora", policy);
    expect(() => verifyQuote(`${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`)).toThrow("Invalid approval token");
  });

  it("blocks overbudget quotes on the server", () => {
    expect(() => issueQuote("key-thunder", policy)).toThrow("Purchase blocked");
  });

  it("expires after fifteen minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-28T10:00:00Z"));
    const { token } = issueQuote("key-aurora", policy);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(() => verifyQuote(token)).toThrow("Quote expired");
  });

  it("invalidates prior approval if merchant price changes", () => {
    const product = findProduct("key-aurora")!;
    const { token } = issueQuote(product.id, policy);
    product.priceCents += 1000;
    try { expect(() => verifyQuote(token)).toThrow("Product or price changed"); }
    finally { product.priceCents -= 1000; }
  });

  it("binds capture proof to the correct PayPal order", () => {
    const { token } = issueQuote("key-aurora", policy);
    const proof = issueOrderProof("ORDER12345", token);
    expect(verifyOrderProof("ORDER12345", proof).productId).toBe("key-aurora");
    expect(() => verifyOrderProof("OTHER12345", proof)).toThrow("Order approval mismatch");
  });
});
