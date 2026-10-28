import { z } from "zod";
import type { Product } from "./catalog";

export const policySchema = z.object({
  maxBudgetCents: z.number().int().min(100).max(1000000),
  blockSubscriptions: z.boolean(),
});

export type SpendingPolicy = z.infer<typeof policySchema>;

export type PolicyResult = {
  allowed: boolean;
  checks: { label: string; passed: boolean; detail: string }[];
};

export function checkPolicy(product: Product, policy: SpendingPolicy): PolicyResult {
  const checks = [
    {
      label: "Budget limit",
      passed: product.priceCents <= policy.maxBudgetCents,
      detail: `${(product.priceCents / 100).toFixed(2)} USD ≤ ${(policy.maxBudgetCents / 100).toFixed(2)} USD`,
    },
    {
      label: "Subscription rule",
      passed: !policy.blockSubscriptions || !product.recurring,
      detail: product.recurring ? "Recurring monthly payment" : "One-time payment",
    },
    {
      label: "Checkout compatibility",
      passed: !product.recurring,
      detail: product.recurring ? "Recurring billing is not implemented in this one-time checkout demo" : "Supported one-time Sandbox checkout",
    },
    { label: "Human approval", passed: true, detail: "Required before starting PayPal Checkout" },
  ];
  return { allowed: checks.every((check) => check.passed), checks };
}
