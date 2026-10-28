import { NextResponse } from "next/server";
import { z } from "zod";
import { findProduct } from "@/lib/catalog";
import { issueOrderProof, verifyQuote } from "@/lib/quote";
import { createOrder } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const { quoteToken } = z.object({ quoteToken: z.string().max(4000) }).parse(await request.json());
    const quote = verifyQuote(quoteToken);
    const product = findProduct(quote.productId)!;
    const orderId = await createOrder(product.name, quote.totalCents, quoteToken);
    return NextResponse.json({ orderId, orderProof: issueOrderProof(orderId, quoteToken) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create PayPal order" }, { status: 400 });
  }
}
