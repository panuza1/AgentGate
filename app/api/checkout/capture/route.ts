import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOrderProof } from "@/lib/quote";
import { captureOrder } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const { orderId, orderProof } = z.object({ orderId: z.string().regex(/^[A-Z0-9]{8,30}$/), orderProof: z.string().max(6000) }).parse(await request.json());
    const quote = verifyOrderProof(orderId, orderProof);
    return NextResponse.json(await captureOrder(orderId, quote.totalCents));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not capture PayPal payment" }, { status: 400 });
  }
}
