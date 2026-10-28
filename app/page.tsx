"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { catalog, usd, type Product } from "@/lib/catalog";
import { checkPolicy, type SpendingPolicy } from "@/lib/policy";
import { PayPalCheckout } from "@/components/paypal-checkout";
import type { AgentResult } from "@/lib/agent";

type Config = { aiReady: boolean; paypalReady: boolean; quoteReady: boolean; clientId: string | null };
type ActiveQuote = { product: Product; token: string; totalCents: number; expiresAt: number };
type Receipt = { status: "COMPLETED"; orderId: string; captureId: string };

const examples = [
  "Find a quiet mechanical keyboard under $100 for work",
  "I need wireless headphones under $70",
  "Show me premium gaming keyboards, even above my budget",
];

function Visual({ product }: { product: Product }) {
  return (
    <div className={`product-visual visual-${product.accent}`} aria-hidden="true">
      {product.category === "keyboard" && <div className="keyboard-art"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
      {product.category === "audio" && <span className="product-glyph">♫</span>}
      {product.category === "desk" && <span className="product-glyph">◈</span>}
      {product.category === "tech" && <span className="product-glyph">⌘</span>}
    </div>
  );
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function Home() {
  const [maxBudget, setMaxBudget] = useState(100);
  const [blockSubscriptions, setBlockSubscriptions] = useState(true);
  const [query, setQuery] = useState(examples[0]);
  const [config, setConfig] = useState<Config | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quote, setQuote] = useState<ActiveQuote | null>(null);
  const [approval, setApproval] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [audit, setAudit] = useState<string[]>([]);

  const policy: SpendingPolicy = useMemo(() => ({ maxBudgetCents: Math.round(maxBudget * 100), blockSubscriptions }), [maxBudget, blockSubscriptions]);
  const check = selected ? checkPolicy(selected, policy) : null;

  useEffect(() => { void fetch("/api/config", { cache: "no-store" }).then((r) => r.json()).then(setConfig).catch(() => setMessage("Could not load server configuration")); }, []);
  useEffect(() => { setQuote(null); setApproval(false); setReceipt(null); }, [maxBudget, blockSubscriptions, selected]);

  const search = async (sample?: string) => {
    const request = sample || query;
    if (sample) setQuery(sample);
    setLoading(true);
    setMessage("");
    setResult(null);
    setSelected(null);
    setAudit([]);
    try {
      const data = await post<AgentResult>("/api/agent", { query: request, policy });
      setResult(data);
      setAudit([`Catalog search completed (${data.mode === "ai" ? "live AI" : "offline matching"})`, "Policy checks will run independently for every product"]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Search failed"); }
    finally { setLoading(false); }
  };

  const prepareQuote = async () => {
    if (!selected || !check?.allowed) return;
    setReviewLoading(true);
    setMessage("");
    try {
      const data = await post<{ token: string; totalCents: number; expiresAt: number }>("/api/quote", { productId: selected.id, policy });
      setQuote({ product: selected, ...data });
      setAudit((entries) => [...entries, `Quote locked at ${usd(data.totalCents)} with a 15-minute expiry`]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not prepare quote"); }
    finally { setReviewLoading(false); }
  };

  const onComplete = useCallback((data: Receipt) => {
    setReceipt(data);
    setAudit((entries) => [...entries, `PayPal Sandbox capture confirmed: ${data.captureId}`]);
  }, []);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-icon">◇</span><span>AGENT<span className="brand-accent">GATE</span></span></div>
        <div className="topbar-right"><span className="top-badge"><span className="live-dot" /> PAYPAL SANDBOX</span><a href="https://github.com/panuza1/AgentGate" target="_blank" rel="noreferrer" className="github-link">GitHub ↗</a></div>
      </header>

      <main className="content-shell">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> THE FUTURE OF RESPONSIBLE COMMERCE</div>
            <h1>Let AI shop.<br /><em>You stay in control.</em></h1>
            <p>Your intelligent shopping agent finds the right products while your spending rules guard every decision. Every purchase needs your approval.</p>
            <div className="hero-labels"><span>✦ Smart product matching</span><span>◈ Deterministic guardrails</span><span>↗ PayPal Checkout</span></div>
          </div>
          <div className="hero-graphic" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="hero-glyph">◇</span><span className="orbit-tag tag-one">AI REASONING <b>●</b></span><span className="orbit-tag tag-two">POLICY VERIFIED ✓</span></div>
        </section>

        <div className="section-caption"><span>01 / SHOPPING CONTROL CENTER</span><span>Single-merchant proof of concept</span></div>
        <div className="dashboard">
          <aside className="control-panel">
            <div className="panel-head"><span className="panel-symbol">⌘</span><div><h2>Spending Constitution</h2><p>Your rules. Non-negotiable.</p></div></div>
            <div className="rule-divider" />
            <label className="field-label" htmlFor="budget">MAXIMUM SPEND <span>USD</span></label>
            <div className="budget-input"><span>$</span><input id="budget" type="number" min="1" max="10000" step="1" value={maxBudget} onChange={(event) => setMaxBudget(Math.min(10000, Math.max(1, Number(event.target.value) || 1)))} /></div>
            <div className="budget-bar"><span style={{ width: `${Math.min(100, maxBudget / 200 * 100)}%` }} /></div>
            <div className="rule-divider" />
            <div className="switch-row"><div><strong>Block subscriptions</strong><small>No recurring charges allowed</small></div><button aria-label="Toggle subscription block" aria-pressed={blockSubscriptions} className={`switch ${blockSubscriptions ? "on" : ""}`} onClick={() => setBlockSubscriptions(!blockSubscriptions)}><i /></button></div>
            <div className="rule-divider" />
            <div className="switch-row"><div><strong>Human approval</strong><small>Required for every checkout</small></div><span className="fixed-rule">ALWAYS ON</span></div>
            <div className="secure-note"><span>✧</span><p>Rules are enforced by server-side code — never by the AI model alone.</p></div>
            <div className="panel-foot"><span className="status-circle" /> POLICY ENGINE ONLINE</div>
          </aside>

          <section className="workspace-panel">
            <div className="workspace-head"><div className="assistant-avatar">✳</div><div><h2>Shopping Agent</h2><p>Tell me what you're looking for.</p></div><span className={`mode-badge ${config?.aiReady ? "online" : "offline"}`}>{config?.aiReady ? "LIVE AI" : "OFFLINE DEMO"}</span></div>
            <div className="search-panel">
              <label className="field-label" htmlFor="request">YOUR SHOPPING REQUEST</label>
              <textarea id="request" value={query} onChange={(event) => setQuery(event.target.value)} rows={3} maxLength={500} placeholder="What can I find for you today?" />
              <div className="search-actions"><span>Try a prompt ↓</span><button onClick={() => void search()} disabled={loading || query.trim().length < 4} className="primary-button">{loading ? "Thinking…" : "Find my match"} <span>↗</span></button></div>
              <div className="prompt-list">{examples.map((example, index) => <button key={example} onClick={() => void search(example)} disabled={loading}><span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>{example}</button>)}</div>
            </div>

            {message && <div className="error-box" role="alert">{message}</div>}
            {result && <div className="agent-summary"><span className="summary-icon">✳</span><div><strong>{result.mode === "ai" ? "Agent reasoning" : "Offline matching — not AI inference"}</strong><p>{result.summary}</p></div></div>}
            {result && <div className="results"><div className="results-title"><div><span>PRODUCT MATCHES</span><h3>Here's what I found</h3></div><span>{result.recommendations.length} RESULTS</span></div>
              <div className="product-list">{result.recommendations.map(({ product, reason }) => {
                const verdict = checkPolicy(product, policy);
                return <article className={`product-card ${selected?.id === product.id ? "chosen" : ""}`} key={product.id}>
                  <Visual product={product} />
                  <div className="product-info"><div className="product-category">{product.category.toUpperCase()} · SAMPLE INVENTORY</div><h4>{product.name}</h4><p>{reason}</p><div className="product-tags">{product.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
                  <div className="product-right"><strong>{usd(product.priceCents)}</strong><span className={`verdict ${verdict.allowed ? "pass" : "fail"}`}>{verdict.allowed ? "✓ POLICY PASS" : "× BLOCKED"}</span><button className="outline-button" onClick={() => { setSelected(product); setMessage(""); }}>{verdict.allowed ? "Review ↗" : "Why blocked?"}</button></div>
                </article>;
              })}</div>
            </div>}
            {!result && !loading && <div className="empty-state"><span>◇</span><h3>A better way to shop starts here.</h3><p>Run a search to compare products, inspect policy decisions, and review a secure purchase.</p><small>{catalog.length} sandbox products available</small></div>}
          </section>
        </div>

        {selected && check && <section className="review-section" id="review"><div className="section-caption"><span>02 / PURCHASE DECISION</span><span>Human-approved execution</span></div><div className="review-grid">
          <div className="review-card"><div className="card-heading"><span className="step-marker">02</span><div><h2>Policy verification</h2><p>Deterministic checks before payment</p></div><span className={`verdict ${check.allowed ? "pass" : "fail"}`}>{check.allowed ? "✓ APPROVED" : "× REJECTED"}</span></div>
            <div className="verification-list">{check.checks.map((item) => <div key={item.label}><span className={`check-icon ${item.passed ? "good" : "bad"}`}>{item.passed ? "✓" : "×"}</span><div><strong>{item.label}</strong><p>{item.detail}</p></div></div>)}</div>
            {!check.allowed && <div className="blocked-note">Purchase blocked by your Spending Constitution. Change your rules or choose another product.</div>}
          </div>
          <div className="review-card"><div className="card-heading"><span className="step-marker">03</span><div><h2>Purchase review</h2><p>No money leaves this sandbox.</p></div></div><div className="order-summary"><div><span>Merchant</span><strong>AgentGate Demo Store</strong></div><div><span>Product</span><strong>{selected.name}</strong></div><div><span>Shipping & tax</span><strong>$0.00 (demo)</strong></div><div className="order-total"><span>ORDER TOTAL</span><strong>{usd(selected.priceCents)}</strong></div></div>
            {receipt ? <div className="success-receipt"><h3>✓ Payment captured in Sandbox</h3><p>Order: {receipt.orderId}</p><p>Capture: {receipt.captureId}</p><small>Testing funds only · No real purchase or shipment</small></div> : !check.allowed ? <button className="primary-button full-width" disabled>Blocked by policy</button> : !quote ? <button className="primary-button full-width" disabled={reviewLoading} onClick={() => void prepareQuote()}>{reviewLoading ? "Preparing…" : "Lock this price & review ↗"}</button> : <div className="approval-area"><label className="approval-row"><input type="checkbox" checked={approval} onChange={(event) => setApproval(event.target.checked)} /><span>I approve exactly <b>{usd(quote.totalCents)}</b> for this sandbox purchase.</span></label>{approval ? (config?.paypalReady && config.clientId ? <PayPalCheckout clientId={config.clientId} quoteToken={quote.token} onComplete={onComplete} /> : <div className="setup-note">PayPal keys are not configured. Add Sandbox credentials to enable real API checkout.</div>) : <p className="micro-copy">Check the approval box to reveal PayPal Sandbox Checkout.</p>}</div>}
            {!config?.quoteReady && <p className="micro-copy">Setup: add QUOTE_SECRET to enable signed purchase reviews.</p>}
          </div>
        </div></section>}

        <section className="bottom-grid"><div className="audit-panel"><div className="section-caption"><span>03 / EXECUTION LOG</span></div><h2>Every decision has a reason.</h2><div className="audit-log">{audit.length ? audit.map((line, index) => <div key={`${index}-${line}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{line}</p></div>) : <p className="audit-empty">Your audit trail appears when the agent starts working.</p>}</div></div><div className="about-panel"><div className="section-caption"><span>THE AGENTGATE PRINCIPLE</span></div><h2>AI chooses.<br />Policy verifies.<br />Human approves.<br /><em>PayPal executes.</em></h2><p>A hackathon proof of concept: fictional catalog, real AI when configured, deterministic guardrails and genuine PayPal Sandbox API calls.</p></div></section>
      </main>
      <footer><span>◇ AGENTGATE / BUILT FOR PAYPAL AI HACKATHON 2026</span><span>SANDBOX ONLY · NO REAL PAYMENTS</span></footer>
    </div>
  );
}
