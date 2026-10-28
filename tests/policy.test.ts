import { describe, expect, it } from "vitest";
import { findProduct } from "../lib/catalog";
import { checkPolicy } from "../lib/policy";

const policy = { maxBudgetCents: 10000, blockSubscriptions: true };

describe("server-side spending policy", () => {
  it("accepts a one-time purchase within budget", () => {
    expect(checkPolicy(findProduct("key-aurora")!, policy).allowed).toBe(true);
  });

  it("blocks an expensive product even if an AI recommends it", () => {
    const result = checkPolicy(findProduct("key-thunder")!, policy);
    expect(result.allowed).toBe(false);
    expect(result.checks[0].passed).toBe(false);
  });

  it("blocks recurring payments", () => {
    const result = checkPolicy(findProduct("tech-cloud")!, policy);
    expect(result.allowed).toBe(false);
    expect(result.checks[1].passed).toBe(false);
  });

  it("does not pretend to support recurring billing when the rule is relaxed", () => {
    const result = checkPolicy(findProduct("tech-cloud")!, { ...policy, blockSubscriptions: false });
    expect(result.checks[1].passed).toBe(true);
    expect(result.checks[2].passed).toBe(false);
    expect(result.allowed).toBe(false);
  });

  it("enforces the inclusive budget boundary", () => {
    expect(checkPolicy(findProduct("key-aurora")!, { ...policy, maxBudgetCents: 7900 }).allowed).toBe(true);
    expect(checkPolicy(findProduct("key-aurora")!, { ...policy, maxBudgetCents: 7899 }).allowed).toBe(false);
  });
});
