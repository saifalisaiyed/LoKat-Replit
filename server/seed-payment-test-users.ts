import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";
import crypto from "crypto";
import { randomUUID } from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedPaymentTestUsers() {
  console.log("Creating payment-ready test accounts...");

  const stripe = await getUncachableStripeClient();

  const existing2 = await db.select().from(users).where(eq(users.email, "seeker2@lokat.app"));
  if (existing2.length > 0) {
    console.log("seeker2@lokat.app already exists — skipping seeker creation.");
  } else {
    console.log("Creating Stripe customer for seeker2@lokat.app...");
    const customer = await stripe.customers.create({
      email: "seeker2@lokat.app",
      name: "Test Seeker 2",
      metadata: { source: "test_seed" },
    });

    const pm = await stripe.paymentMethods.create({
      type: "card",
      card: { token: "tok_visa" },
    });

    await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id },
    });

    await db.insert(users).values({
      id: randomUUID(),
      username: "test_seeker2",
      email: "seeker2@lokat.app",
      phone: "+15550000002",
      displayName: "Test Seeker 2",
      password: hashPassword("demo1234"),
      isAdmin: false,
      stripeCustomerId: customer.id,
      hasPaymentMethod: true,
      earnings: 0,
      requestsCreated: 0,
      requestsFulfilled: 0,
    });

    console.log(`✓ seeker2@lokat.app created (Stripe customer: ${customer.id}, PM: ${pm.id})`);
  }

  const existingL2 = await db.select().from(users).where(eq(users.email, "lokater2@lokat.app"));
  if (existingL2.length > 0) {
    console.log("lokater2@lokat.app already exists — skipping lokater creation.");
  } else {
    await db.insert(users).values({
      id: randomUUID(),
      username: "test_lokater2",
      email: "lokater2@lokat.app",
      phone: "+15550000003",
      displayName: "Test LoKater 2",
      password: hashPassword("demo1234"),
      isAdmin: false,
      hasPaymentMethod: false,
      payoutInfo: JSON.stringify({ type: "paypal", email: "testlokater2@paypal.com" }),
      earnings: 0,
      requestsCreated: 0,
      requestsFulfilled: 0,
    });

    console.log("✓ lokater2@lokat.app created (payout: PayPal testlokater2@paypal.com)");
  }

  console.log("\nDone. Test accounts ready:");
  console.log("  seeker2@lokat.app  / demo1234  — Visa card on file, ready to post requests");
  console.log("  lokater2@lokat.app / demo1234  — PayPal payout on file, ready to accept requests");
}

seedPaymentTestUsers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });
