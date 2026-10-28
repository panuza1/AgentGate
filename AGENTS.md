# AgentGate coding guidelines

- Keep scope focused on the Hackathon MVP in `IMPLEMENTATION_PLAN.md`.
- Use one Next.js/TypeScript repository; do not introduce agent frameworks, authentication, queues, a database or extra infrastructure for single-use features.
- Treat AI output and browser input as untrusted. Keep all purchase amounts and guardrail enforcement on the server.
- PayPal Sandbox only. Never add live payment endpoints without an explicit separate request.
- Do not commit secrets. Read credentials through server-side environment variables.
- Before completing a change, run `npm test`, `npm run typecheck`, and `npm run build`.
- Do not report AI inference or PayPal capture as validated unless tested with real configured credentials.
