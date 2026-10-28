export type Product = {
  id: string;
  name: string;
  category: "audio" | "keyboard" | "desk" | "tech";
  priceCents: number;
  description: string;
  tags: string[];
  recurring: boolean;
  accent: string;
};

// Fictional, sandbox-only merchant inventory; prices include free shipping and no tax.
export const catalog: Product[] = [
  { id: "key-aurora", name: "Aurora 75 Keyboard", category: "keyboard", priceCents: 7900, description: "Compact mechanical keyboard with quiet switches and wireless mode.", tags: ["keyboard", "mechanical", "quiet", "wireless", "work"], recurring: false, accent: "mint" },
  { id: "key-nimbus", name: "Nimbus Silent Keys", category: "keyboard", priceCents: 9400, description: "Low-noise mechanical board with soft-touch keycaps.", tags: ["keyboard", "mechanical", "quiet", "work"], recurring: false, accent: "blue" },
  { id: "key-thunder", name: "Thunder RGB Pro", category: "keyboard", priceCents: 12900, description: "Bright RGB mechanical keyboard with clicky switches.", tags: ["keyboard", "mechanical", "gaming", "rgb", "loud"], recurring: false, accent: "violet" },
  { id: "key-lite", name: "Draft 65 Wireless", category: "keyboard", priceCents: 5900, description: "Affordable compact wireless keyboard for everyday typing.", tags: ["keyboard", "wireless", "work", "budget"], recurring: false, accent: "sand" },
  { id: "aud-pulse", name: "Pulse Studio Headphones", category: "audio", priceCents: 8900, description: "Comfortable over-ear headphones with active noise cancellation.", tags: ["headphones", "audio", "wireless", "noise-cancelling", "work"], recurring: false, accent: "violet" },
  { id: "aud-breeze", name: "Breeze Wireless Earbuds", category: "audio", priceCents: 4900, description: "Lightweight wireless earbuds for commuting and calls.", tags: ["earbuds", "audio", "wireless", "budget"], recurring: false, accent: "blue" },
  { id: "aud-orbit", name: "Orbit Reference Headset", category: "audio", priceCents: 13900, description: "Premium headset with clear voice pickup and rich sound.", tags: ["headphones", "audio", "premium", "work"], recurring: false, accent: "mint" },
  { id: "desk-rise", name: "Rise Adjustable Stand", category: "desk", priceCents: 4200, description: "Aluminum laptop stand with adjustable height.", tags: ["stand", "desk", "laptop", "work", "ergonomic"], recurring: false, accent: "sand" },
  { id: "desk-glow", name: "Glow Desk Light", category: "desk", priceCents: 3500, description: "Dimmable desk lamp with warm and cool settings.", tags: ["desk", "lamp", "light", "work"], recurring: false, accent: "blue" },
  { id: "desk-cloud", name: "Cloud Wrist Rest", category: "desk", priceCents: 1900, description: "Soft wrist support for long typing sessions.", tags: ["desk", "keyboard", "ergonomic", "work", "budget"], recurring: false, accent: "mint" },
  { id: "tech-hub", name: "Link 7-in-1 USB-C Hub", category: "tech", priceCents: 6400, description: "Multiport USB-C hub for your everyday workspace.", tags: ["hub", "usb", "laptop", "work"], recurring: false, accent: "violet" },
  { id: "tech-cloud", name: "Cloud Vault Membership", category: "tech", priceCents: 1200, description: "Monthly cloud backup membership, billed every month.", tags: ["cloud", "storage", "subscription", "monthly"], recurring: true, accent: "blue" },
];

export function findProduct(id: string) {
  return catalog.find((product) => product.id === id);
}

export function usd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
