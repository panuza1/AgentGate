# AgentGate implementation plan

Target: PayPal AI Hackathon deadline **November 12, 2026 at 12:00 PST** (**November 13 at 03:00 ICT**).

## Scope

One fictional merchant, 12 sample products, web-based shopping request, AI recommendations, server-side spending policy, explicit human approval, PayPal Sandbox Order/Capture, receipt and audit. No real payments or third-party retailer checkout.

## Build progress

- [x] Next.js TypeScript app and responsive shopping interface
- [x] Sample merchant catalog and price display
- [x] AI recommendation endpoint (requires runtime API key) with transparent offline fallback
- [x] Deterministic budget/subscription policy engine
- [x] Tamper-resistant approval quote and price change checks
- [x] PayPal Sandbox create-order and capture endpoints
- [x] PayPal JavaScript SDK v6 integration
- [x] Automated policy, quote, and AI input tests
- [ ] Configure PayPal Sandbox business + buyer test credentials (owner action)
- [ ] Configure AI API key and validate live model responses (owner action)
- [ ] Run real Sandbox buyer approval and capture (requires credentials)
- [ ] Deploy configured demonstration and verify public accessibility
- [ ] Record/submission: public YouTube demo (<3 min), Devpost text and project URL

## Suggested final sprint

| Date (2026, ICT) | Work |
| --- | --- |
| Oct 28–29 | Validate local build, obtain API/Sandbox keys, first real Sandbox capture |
| Oct 30–Nov 2 | Improve AI ranking and test Thai/English prompts; verify policy failure cases |
| Nov 3–6 | Validate end-to-end flow on hosted preview with real keys |
| Nov 7–9 | UX polish, reliability and negative payment testing |
| Nov 10–11 | English demo video, README, screenshots and Devpost submission draft |
| Nov 12 | Final verification and submission buffer |

## Security invariants

1. PayPal credentials never leave the backend and `api-m.sandbox.paypal.com` is the only payment API host.
2. Server validates SKU, price, policy, quote signature, expiry and matching PayPal order amount.
3. Buyer explicitly approves both the quote and the PayPal payment.
4. No LLM output can independently create or capture a purchase.
5. Missing credentials show setup errors, never fictitious payment success.
