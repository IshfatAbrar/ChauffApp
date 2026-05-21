/**
 * Reset Fleet Stripe Account
 *
 * This script helps reset a fleet's Stripe account if it was created with
 * the wrong country settings (e.g., AU instead of US).
 *
 * Usage:
 * node scripts/reset-fleet-stripe-account.js <fleetEmail>
 *
 * IMPORTANT: This will delete the existing Stripe account and create a new one.
 * Any connected bank accounts will need to be re-added.
 */

const Stripe = require("stripe");
const Fleet = require("../lib/models/fleet.model");
const { connectMongoDB } = require("../lib/mongodb");

// Load .env file if dotenv is available
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not installed, env vars should be set manually
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function resetFleetStripeAccount(fleetEmail) {
  try {
    await connectMongoDB();

    console.log("🔍 Finding fleet with email:", fleetEmail);
    const fleet = await Fleet.findOne({ email: fleetEmail });

    if (!fleet) {
      console.error("❌ Fleet not found with email:", fleetEmail);
      process.exit(1);
    }

    console.log("✅ Found fleet:", fleet.businessName);
    console.log("Fleet ID:", fleet._id);

    // Check if fleet has a Stripe account
    if (fleet.stripeAccountID) {
      console.log("🔍 Current Stripe Account ID:", fleet.stripeAccountID);

      try {
        // Retrieve the account to check its country
        const existingAccount = await stripe.accounts.retrieve(
          fleet.stripeAccountID
        );
        console.log("📍 Current account country:", existingAccount.country);

        if (existingAccount.country === "US") {
          console.log("✅ Account is already set to US. No action needed.");
          console.log(
            "\nIf you're still seeing AU in the onboarding form, try:"
          );
          console.log("1. Clear your browser cache");
          console.log("2. Use an incognito/private window");
          console.log(
            "3. The account might have cached data - complete the onboarding and it should save with US settings"
          );
          process.exit(0);
        }

        console.log(
          "\n⚠️  WARNING: This will DELETE the existing Stripe account!"
        );
        console.log("Account details:");
        console.log("- Country:", existingAccount.country);
        console.log("- Email:", existingAccount.email);
        console.log("- Details submitted:", existingAccount.details_submitted);
        console.log("\nAny connected bank accounts will be removed.");

        // In a production script, you'd want to add a confirmation prompt here
        console.log("\n🗑️  Deleting old Stripe account...");
        await stripe.accounts.del(fleet.stripeAccountID);
        console.log("✅ Old account deleted");
      } catch (error) {
        if (error.code === "resource_missing") {
          console.log(
            "⚠️  Stripe account not found in Stripe. Cleaning up database reference..."
          );
        } else {
          throw error;
        }
      }

      // Clear the old account ID
      fleet.stripeAccountID = null;
      fleet.stripeAccountVerified = false;
      await fleet.save();
      console.log("✅ Database cleaned up");
    } else {
      console.log("ℹ️  No existing Stripe account found");
    }

    // Create new US-based account
    console.log("\n🆕 Creating new US-based Stripe account...");
    const newAccount = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: fleet.email,
      business_type: "company",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_profile: {
        name: fleet.businessName,
      },
      default_currency: "usd",
    });

    console.log("✅ New Stripe account created!");
    console.log("Account ID:", newAccount.id);
    console.log("Country:", newAccount.country);
    console.log("Currency:", newAccount.default_currency);

    // Save to database
    fleet.stripeAccountID = newAccount.id;
    fleet.stripeAccountVerified = false;
    await fleet.save();

    console.log(
      "\n✅ SUCCESS! Fleet Stripe account has been reset with US settings."
    );
    console.log("\n📝 Next steps:");
    console.log("1. The fleet should go to /fleet/payments");
    console.log("2. Click 'Connect with Stripe' or 'Complete Setup'");
    console.log("3. The onboarding form should now show US fields");
    console.log("4. Complete the onboarding with US bank details");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get fleet email from command line arguments
const fleetEmail = process.argv[2];

if (!fleetEmail) {
  console.error("❌ Please provide a fleet email address");
  console.log("\nUsage:");
  console.log("  node scripts/reset-fleet-stripe-account.js <fleetEmail>");
  console.log("\nExample:");
  console.log("  node scripts/reset-fleet-stripe-account.js fleet@example.com");
  process.exit(1);
}

resetFleetStripeAccount(fleetEmail);
