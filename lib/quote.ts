import { createHmac, timingSafeEqual } from "node:crypto";
import { findProduct } from "./catalog";
import { checkPolicy, policySchema, type SpendingPolicy } from "./policy";

export type Quote = {
  productId: string;
  totalCents: number;
  policy: SpendingPolicy;
  issuedAt: number;
};

function secret() {
  if (!process.env.QUOTE_SECRET || process.env.QUOTE_SECRET.length < 32) {
    throw new Error("QUOTE_SECRET must be configured (at least 32 characters)");
  }
  return process.env.QUOTE_SECRET;
}

function sign(encoded: string) {
  return createHmac("sha256", secret()).update(encoded).digest("hex");
}

function seal(value: unknown) {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function open<T>(token: string): T {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra || signature.length !== 64 || !/^[a-f0-9]+$/.test(signature)) {
    throw new Error("Invalid approval token");
  }
  if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(encoded), "hex"))) {
    throw new Error("Invalid approval token");
  }
  const data: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!data || typeof data !== "object") throw new Error("Invalid approval token");
  return data as T;
}

export function issueQuote(productId: string, policy: SpendingPolicy) {
  const product = findProduct(productId);
  if (!product) throw new Error("Product not found");
  if (!checkPolicy(product, policy).allowed) throw new Error("Purchase blocked by policy");
  const quote: Quote = {
    productId: product.id,
    totalCents: product.priceCents,
    policy,
    issuedAt: Date.now(),
  };
  return { token: seal(quote), quote };
}

export function verifyQuote(token: string): Quote {
  const quote = open<Quote>(token);
  if (!Number.isFinite(quote.issuedAt) || quote.issuedAt > Date.now() + 60000 || Date.now() - quote.issuedAt > 15 * 60 * 1000) {
    throw new Error("Quote expired. Please approve the purchase again.");
  }
  const policy = policySchema.parse(quote.policy);
  const product = findProduct(quote.productId);
  if (!product || product.priceCents !== quote.totalCents || !checkPolicy(product, policy).allowed) {
    throw new Error("Product or price changed. Please approve again.");
  }
  return quote;
}

export function issueOrderProof(orderId: string, quoteToken: string) {
  return seal({ orderId, quoteToken });
}

export function verifyOrderProof(orderId: string, proof: string) {
  const data = open<{ orderId: string; quoteToken: string }>(proof);
  if (data.orderId !== orderId || typeof data.quoteToken !== "string") throw new Error("Order approval mismatch");
  return verifyQuote(data.quoteToken);
}
