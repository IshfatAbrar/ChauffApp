/**
 * Migration Script: Old Payment System to New Secure Payment System
 *
 * This script migrates existing data from the old payment structure
 * to the new secure payment structure.
 *
 * Run this script ONCE after deploying the new payment system.
 */

const { MongoClient } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function migratePaymentData() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log("🚀 Starting payment system migration...");

    // Step 1: Migrate Driver Model
    console.log("📝 Migrating driver model...");
    await migrateDrivers(db);

    // Step 2: Migrate Booking Model
    console.log("📝 Migrating booking model...");
    await migrateBookings(db);

    // Step 3: Update Stripe Customers
    console.log("📝 Updating Stripe customers...");
    await updateStripeCustomers(db);

    // Step 4: Create Indexes
    console.log("📝 Creating database indexes...");
    await createIndexes(db);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

async function migrateDrivers(db) {
  const drivers = db.collection("drivers");

  // Add new fields to existing drivers
  const result = await drivers.updateMany(
    {},
    {
      $set: {
        stripeAccountVerified: false,
        canReceivePayments: false,
        balance: 0,
        pendingBalance: 0,
        paymentSettings: {
          minimumPayoutAmount: 10,
          autoPayoutEnabled: true,
        },
        isActive: true,
        isVerified: false,
      },
      $unset: {
        // Remove old fields if they exist
        transactions: "",
      },
    }
  );

  // Initialize new transactions array
  await drivers.updateMany(
    {},
    {
      $set: {
        transactions: [],
      },
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} drivers`);

  // Check Stripe account status for existing drivers
  const driversWithStripe = await drivers
    .find({
      stripeAccountID: { $exists: true, $ne: null, $ne: "" },
    })
    .toArray();

  for (const driver of driversWithStripe) {
    try {
      const account = await stripe.accounts.retrieve(driver.stripeAccountID);

      await drivers.updateOne(
        { _id: driver._id },
        {
          $set: {
            stripeAccountVerified: account.details_submitted,
            canReceivePayments: account.charges_enabled,
          },
        }
      );

      console.log(`✅ Updated Stripe status for driver ${driver._id}`);
    } catch (error) {
      console.log(
        `⚠️  Could not verify Stripe account for driver ${driver._id}: ${error.message}`
      );
    }
  }
}

async function migrateBookings(db) {
  const bookings = db.collection("bookings");

  // Rename stripeId to stripePaymentMethodId and add new payment structure
  const result = await bookings.updateMany({ stripeId: { $exists: true } }, [
    {
      $set: {
        stripePaymentMethodId: "$stripeId",
        stripeCustomerId: "", // Will be populated later
        payment: {
          status: "pending",
          platformFee: { $multiply: ["$price", 0.1] },
          driverAmount: { $multiply: ["$price", 0.9] },
          stripeFee: 0,
          processedAt: null,
          failureReason: null,
          refundAmount: 0,
          refundedAt: null,
        },
        statusHistory: [
          {
            status: "$status",
            timestamp: "$createdAt",
            updatedBy: "migration",
            reason: "Initial status from migration",
          },
        ],
        cancellation: {},
        rating: {},
      },
    },
    {
      $unset: "stripeId",
    },
  ]);

  console.log(`✅ Updated ${result.modifiedCount} bookings`);

  // Update completed bookings payment status
  await bookings.updateMany(
    { status: "complete" },
    {
      $set: {
        "payment.status": "completed",
        "payment.processedAt": new Date(),
      },
    }
  );

  console.log(`✅ Updated payment status for completed bookings`);
}

async function updateStripeCustomers(db) {
  const bookings = db.collection("bookings");

  // Get unique emails from bookings
  const uniqueEmails = await bookings.distinct("email");

  for (const email of uniqueEmails) {
    try {
      // Find or create Stripe customer
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            created_by: "migration_script",
          },
        });
        customerId = customer.id;
      }

      // Update all bookings for this email
      await bookings.updateMany(
        { email: email },
        {
          $set: {
            stripeCustomerId: customerId,
          },
        }
      );

      console.log(`✅ Updated customer ID for ${email}`);
    } catch (error) {
      console.log(`⚠️  Could not process customer ${email}: ${error.message}`);
    }
  }
}

async function createIndexes(db) {
  const drivers = db.collection("drivers");
  const bookings = db.collection("bookings");

  // Driver indexes
  await drivers.createIndex({ email: 1 });
  await drivers.createIndex({ stripeAccountID: 1 });
  await drivers.createIndex({ "transactions.status": 1 });
  await drivers.createIndex({ "transactions.paymentIntentId": 1 });

  // Booking indexes
  await bookings.createIndex({ email: 1 });
  await bookings.createIndex({ chauffeur: 1 });
  await bookings.createIndex({ status: 1 });
  await bookings.createIndex({ "payment.status": 1 });
  await bookings.createIndex({ "payment.paymentIntentId": 1 });
  await bookings.createIndex({ stripeCustomerId: 1 });
  await bookings.createIndex({ createdAt: -1 });

  console.log("✅ Created database indexes");
}

// Rollback function (use only if migration needs to be reversed)
async function rollbackMigration() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log("🔄 Rolling back migration...");

    // Rollback drivers
    const drivers = db.collection("drivers");
    await drivers.updateMany(
      {},
      {
        $unset: {
          stripeAccountVerified: "",
          canReceivePayments: "",
          balance: "",
          pendingBalance: "",
          paymentSettings: "",
          isActive: "",
          isVerified: "",
          transactions: "",
        },
      }
    );

    // Rollback bookings
    const bookings = db.collection("bookings");
    await bookings.updateMany({ stripePaymentMethodId: { $exists: true } }, [
      {
        $set: {
          stripeId: "$stripePaymentMethodId",
        },
      },
      {
        $unset: [
          "stripePaymentMethodId",
          "stripeCustomerId",
          "payment",
          "statusHistory",
          "cancellation",
          "rating",
        ],
      },
    ]);

    console.log("✅ Rollback completed");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Validation function to check migration success
async function validateMigration() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log("🔍 Validating migration...");

    const drivers = db.collection("drivers");
    const bookings = db.collection("bookings");

    // Check drivers
    const driversCount = await drivers.countDocuments();
    const driversWithNewFields = await drivers.countDocuments({
      stripeAccountVerified: { $exists: true },
      canReceivePayments: { $exists: true },
    });

    console.log(`Drivers: ${driversWithNewFields}/${driversCount} migrated`);

    // Check bookings
    const bookingsCount = await bookings.countDocuments();
    const bookingsWithNewFields = await bookings.countDocuments({
      stripePaymentMethodId: { $exists: true },
      "payment.status": { $exists: true },
    });

    console.log(`Bookings: ${bookingsWithNewFields}/${bookingsCount} migrated`);

    // Check for old fields
    const oldStripeId = await bookings.countDocuments({
      stripeId: { $exists: true },
    });
    if (oldStripeId > 0) {
      console.log(
        `⚠️  Warning: ${oldStripeId} bookings still have old stripeId field`
      );
    }

    console.log("✅ Validation completed");
  } catch (error) {
    console.error("❌ Validation failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Main execution
if (require.main === module) {
  const action = process.argv[2];

  switch (action) {
    case "migrate":
      migratePaymentData().catch(console.error);
      break;
    case "rollback":
      rollbackMigration().catch(console.error);
      break;
    case "validate":
      validateMigration().catch(console.error);
      break;
    default:
      console.log(
        "Usage: node migrate-payment-data.js [migrate|rollback|validate]"
      );
      break;
  }
}

module.exports = {
  migratePaymentData,
  rollbackMigration,
  validateMigration,
};
