import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

// Explicitly use Node's native https rather than the global fetch
// that Next.js patches for caching (which breaks Stripe's HTTP client
// in Vercel serverless functions).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
  httpClient: Stripe.createNodeHttpClient(),
});
