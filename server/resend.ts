import { Resend } from "resend";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

// Cached Resend client — refreshed every hour
let _resendCache: { client: Resend; fromEmail: string; expiresAt: number } | null = null;

export async function getUncachableResendClient() {
  const now = Date.now();
  if (_resendCache && now < _resendCache.expiresAt) return _resendCache;
  const { apiKey, fromEmail } = await getCredentials();
  _resendCache = {
    client: new Resend(apiKey),
    fromEmail: fromEmail || "LoKat App <onboarding@resend.dev>",
    expiresAt: now + 60 * 60 * 1000,
  };
  return _resendCache;
}
