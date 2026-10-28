import { NextResponse } from "next/server";
import { z } from "zod";
import { issueQuote } from "@/lib/quote";
import { policySchema } from "@/lib/policy";

const inputSchema = z.object({ productId: z.string(), policy: policySchema });

export async function POST(request: Request) {
  try {
    const { productId, policy } = inputSchema.parse(await request.json());
    const { token, quote } = issueQuote(productId, policy);
    return NextResponse.json({ token, totalCents: quote.totalCents, expiresAt: quote.issuedAt + 15 * 60 * 1000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid quote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
