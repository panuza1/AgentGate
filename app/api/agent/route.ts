import { NextResponse } from "next/server";
import { z } from "zod";
import { recommend } from "@/lib/agent";
import { policySchema } from "@/lib/policy";

const inputSchema = z.object({ query: z.string().trim().min(4).max(500), policy: policySchema });

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    return NextResponse.json(await recommend(input.query, input.policy));
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid shopping request or policy" : error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: error instanceof z.ZodError ? 400 : 502 });
  }
}
