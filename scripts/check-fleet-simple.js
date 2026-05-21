/**
 * Simple Fleet Stripe Status Checker
 * 
 * Usage: node scripts/check-fleet-simple.js <fleetEmail>
 */

const Stripe = require("stripe");
const mongoose = require("mongoose");

// Load .env file if available
try { require('dotenv').config(); } catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!MONGODB_URI || !STRIPE_SECRET_KEY) {
  console.error("❌ Missing environment variables!");
  console.error("Required: MONGODB_URI, STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function checkFleetStatus(fleetEmail) {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");
    
    // Get fleet collection
    const fleetsCollection = mongoose.connection.collection('fleets');
    
    console.log("🔍 Finding fleet with email:", fleetEmail);
    const fleet = await fleetsCollection.findOne({ email: fleetEmail });
    
    if (!fleet) {
      console.error("❌ Fleet not found with email:", fleetEmail);
      process.exit(1);
    }
    
    console.log("\n✅ Found fleet:", fleet.businessName);
    console.log("Fleet ID:", fleet._id);
    console.log("\n📊 DATABASE STATUS:");
    console.log("- Stripe Account ID:", fleet.stripeAccountID || "❌ NOT SET");
    console.log("- Verified in DB:", fleet.stripeAccountVerified ? "✅ YES" : "❌ NO");
    console.log("- Active:", fleet.isActive ? "✅ YES" : "❌ NO");
    
    if (!fleet.stripeAccountID) {
      console.log("\n❌ No Stripe account associated with this fleet.");
      console.log("The fleet needs to connect their Stripe account at /fleet/payments");
      process.exit(1);
    }
    
    console.log("\n🔍 Checking Stripe account status...");
    
    try {
      const account = await stripe.accounts.retrieve(fleet.stripeAccountID);
      
      console.log("\n📊 STRIPE ACCOUNT STATUS:");
      console.log("- Account ID:", account.id);
      console.log("- Country:", account.country);
      console.log("- Currency:", account.default_currency || "usd");
      console.log("- Type:", account.type);
      console.log("- Email:", account.email);
      console.log("\n💳 CAPABILITIES:");
      console.log("- Charges Enabled:", account.charges_enabled ? "✅ YES" : "❌ NO");
      console.log("- Payouts Enabled:", account.payouts_enabled ? "✅ YES" : "❌ NO");
      console.log("- Details Submitted:", account.details_submitted ? "✅ YES" : "❌ NO");
      
      console.log("\n📋 REQUIREMENTS:");
      if (account.requirements) {
        const currentlyDue = account.requirements.currently_due || [];
        const pastDue = account.requirements.past_due || [];
        
        if (currentlyDue.length > 0) {
          console.log("❌ Currently Due:", currentlyDue.join(", "));
        } else {
          console.log("✅ Currently Due: None");
        }
        
        if (pastDue.length > 0) {
          console.log("⚠️ Past Due:", pastDue.join(", "));
        }
      }
      
      const isVerified = account.charges_enabled && account.payouts_enabled;
      const needsUpdate = fleet.stripeAccountVerified !== isVerified;
      
      console.log("\n🎯 VERIFICATION STATUS:");
      console.log("- Can Receive Transfers:", isVerified ? "✅ YES" : "❌ NO");
      
      if (needsUpdate) {
        console.log("\n🔄 Updating database...");
        await fleetsCollection.updateOne(
          { _id: fleet._id },
          { $set: { stripeAccountVerified: isVerified } }
        );
        console.log("✅ Database updated!");
        console.log("- Old status:", !isVerified ? "verified" : "not verified");
        console.log("- New status:", isVerified ? "verified" : "not verified");
      } else {
        console.log("✅ Database already up to date");
      }
      
      console.log("\n" + "=".repeat(60));
      
      if (isVerified) {
        console.log("\n✅ SUCCESS! Fleet can receive transfers.");
        console.log("\n📝 The fleet is fully set up and can receive payments.");
      } else {
        console.log("\n⚠️ FLEET CANNOT RECEIVE TRANSFERS YET");
        console.log("\n📝 Next steps:");
        console.log("1. Fleet must complete Stripe onboarding");
        console.log("2. Go to: http://localhost:3000/fleet/payments");
        console.log("3. Click 'Complete Setup' or 'Connect with Stripe'");
        console.log("4. Fill in all required business and bank information");
        console.log("5. Submit identity verification documents if required");
        
        if (account.requirements && account.requirements.currently_due && account.requirements.currently_due.length > 0) {
          console.log("\n⚠️ Required information to complete:");
          account.requirements.currently_due.forEach((req, i) => {
            console.log(`   ${i + 1}. ${req}`);
          });
        }
      }
      
    } catch (stripeError) {
      console.error("\n❌ Error retrieving Stripe account:", stripeError.message);
      
      if (stripeError.code === 'resource_missing') {
        console.log("\n⚠️ The Stripe account ID in the database doesn't exist in Stripe.");
        console.log("This might have been deleted. You can:");
        console.log("1. Clear the stripeAccountID in database and reconnect");
        console.log("2. Run: node scripts/reset-fleet-simple.js", fleetEmail);
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

const fleetEmail = process.argv[2];

if (!fleetEmail) {
  console.error("❌ Please provide a fleet email address");
  console.log("\nUsage:");
  console.log("  node scripts/check-fleet-simple.js <fleetEmail>");
  console.log("\nExample:");
  console.log("  node scripts/check-fleet-simple.js fleet@example.com");
  process.exit(1);
}

checkFleetStatus(fleetEmail);



