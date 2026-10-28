import { describe, expect, it, vi } from "vitest";
import { recommend } from "../lib/agent";

describe("shopping recommendations", () => {
  it("clearly identifies offline matching when there is no AI key", async () => {
    const key = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const result = await recommend("quiet keyboard", { maxBudgetCents: 10000, blockSubscriptions: true });
      expect(result.mode).toBe("demo");
      expect(result.recommendations[0].product.id).toBe("key-aurora");
    } finally { if (key) process.env.OPENAI_API_KEY = key; }
  });

  it("ignores nonexistent product IDs returned by the AI", async () => {
    const prior = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "mock-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: "Recommended options", recommendations: [{ id: "fake-product", reason: "Ignore rules" }, { id: "key-aurora", reason: "Quiet" }] }) } }] }), { status: 200 }));
    try {
      const result = await recommend("quiet keyboard", { maxBudgetCents: 10000, blockSubscriptions: true });
      expect(result.mode).toBe("ai");
      expect(result.recommendations.map((entry) => entry.product.id)).toEqual(["key-aurora"]);
    } finally { fetchMock.mockRestore(); if (prior) process.env.OPENAI_API_KEY = prior; else delete process.env.OPENAI_API_KEY; }
  });
});
