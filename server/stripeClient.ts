import Stripe from "stripe";

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found");
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": xReplitToken,
    },
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.publishable || !connectionSettings?.settings?.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable as string,
    secretKey: connectionSettings.settings.secret as string,
  };
}

// Cached Stripe client — refreshed every hour
let _stripeCache: { client: Stripe; publishableKey: string; expiresAt: number } | null = null;

async function getCachedCredentials() {
  const now = Date.now();
  if (_stripeCache && now < _stripeCache.expiresAt) return _stripeCache;
  const { secretKey, publishableKey } = await getCredentials();
  _stripeCache = {
    client: new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any }),
    publishableKey,
    expiresAt: now + 60 * 60 * 1000,
  };
  return _stripeCache;
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  return (await getCachedCredentials()).client;
}

export async function getStripePublishableKey(): Promise<string> {
  return (await getCachedCredentials()).publishableKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import("stripe-replit-sync");
    const { secretKey } = await getCredentials();
    stripeSync = new StripeSync({
      poolConfig: { connectionString: process.env.DATABASE_URL!, max: 2 },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
