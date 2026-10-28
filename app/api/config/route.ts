import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    aiReady: Boolean(process.env.OPENAI_API_KEY),
    paypalReady: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    quoteReady: Boolean(process.env.QUOTE_SECRET && process.env.QUOTE_SECRET.length >= 32),
    clientId: process.env.PAYPAL_CLIENT_ID || null,
  }, { headers: { "Cache-Control": "no-store" } });
}
