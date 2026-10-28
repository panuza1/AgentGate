# AgentGate

**AI chooses. Policy verifies. Human approves. PayPal executes.**

AgentGate is a policy-first shopping agent built for the **PayPal AI Hackathon 2026**. It combines a real LLM-powered recommendation step (when configured), deterministic spending rules, signed purchase quotes, and **PayPal Sandbox** checkout. It uses a fictional single-merchant product catalog. No real money is moved and no products are shipped.

## What's implemented

- Natural-language shopping requests, with OpenAI JSON responses mapped to a known merchant catalog
- Clearly labelled offline catalog-matching mode when `OPENAI_API_KEY` is absent (offline mode is **not AI inference**)
- Spending Constitution: budget cap, subscription block, mandatory explicit purchase review
- Server-side policy checks, signed 15-minute quotes, invalidation after a catalog price change
- PayPal Orders v2 create/capture against `api-m.sandbox.paypal.com`, PayPal JavaScript SDK v6
- Server verification of approved order amount and idempotent payment requests
- Sandbox receipt with Order ID / Capture ID and an on-page audit trail
- Responsive web UI and automated unit tests

## Local setup

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Configure the following values in `.env.local` (never commit it):

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables live AI recommendation; without it the UI explicitly says Offline Demo |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `PAYPAL_CLIENT_ID` | Sandbox application client ID, safe for the front-end SDK |
| `PAYPAL_CLIENT_SECRET` | Sandbox application secret, server only |
| `QUOTE_SECRET` | Random server-side secret of **at least 32 characters**, used to sign purchase approvals |

Generate a quote secret locally with `openssl rand -hex 32`. Get Sandbox credentials and buyer test accounts from [PayPal Developer Dashboard](https://developer.paypal.com/). The app is intentionally **Sandbox-only** and has no live PayPal endpoint.

Run `npm test`, `npm run typecheck`, and `npm run build` before submitting. For deployment, configure the same environment variables in the hosting provider; do not place secrets in public GitHub files. Live AI calls require a provider key with API access and may incur charges.

## End-to-end flow

1. Enter a request; the AI recommends IDs from 12 fictional merchant products.
2. Independently evaluate every product against the server-side spending rules.
3. Select an allowed item and request a signed quote. Shipping and tax are both $0 in the demo catalog.
4. Explicitly approve the displayed total; PayPal Sandbox Checkout becomes available.
5. PayPal JS SDK v6 asks the Sandbox buyer to authorize payment; the backend creates the order.
6. Backend verifies the order total, captures using Orders v2, and shows a Sandbox Capture ID.

The LLM never receives a payment credential, cannot issue quotes, and cannot set the payable amount. All amounts come from the merchant catalog on the server. Quotes expire after 15 minutes and are tied to current product prices. `PayPal-Request-Id` avoids duplicate creates/captures on retries.

## Demo scenarios

1. **Successful checkout:** Set $100 budget, request a quiet mechanical keyboard, review Aurora 75 for $79, then approve and pay using a Sandbox buyer.
2. **Overbudget:** Select Thunder RGB Pro ($129) with the $100 cap. The policy refuses to issue a quote.
3. **Subscription protection:** Select Cloud Vault Membership while subscriptions are blocked. The policy refuses to issue a quote.
4. **Price integrity:** Tests verify that changing catalog price after quote issuance invalidates the old quote.

## Limitations

- This is a **single fictional merchant**. It does not buy from arbitrary third-party stores or transfer funds to external retailers.
- The catalog includes one subscription-labelled test item to demonstrate policy blocking; recurring billing is not implemented and that item cannot be checked out.
- There is no delivery, real inventory, real subscriptions, account login, or persistent purchase history.
- Audit log is browser-session state; PayPal remains the source of truth for real Sandbox capture statuses.
- The app cannot complete live AI inference or Sandbox payments until valid keys have been added. UI does not fake either capability.
- Tests mock payment/AI external calls where appropriate; a live Sandbox payment must be validated manually with buyer and business test accounts.

## Hackathon submission checklist

- [ ] Configure AI and PayPal Sandbox keys on deployed demo
- [ ] Verify live AI recommendation and successful Sandbox capture
- [ ] Record a functioning English demo video shorter than 3 minutes and upload publicly to YouTube
- [ ] Include the hosted demo URL, public GitHub repository, technology description, and setup instructions in Devpost
- [ ] Keep the demo accessible to judges through the judging period

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the project workplan and status.

## License

MIT — see [LICENSE](LICENSE).
