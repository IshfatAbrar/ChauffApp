/**
 * Migration Script: Add Region and Currency Fields
 * 
 * This script adds the region and currency fields to existing Fleet and Booking documents.
 * All existing data will be set to US region with USD currency (the current default).
 * 
 * Usage: node scripts/migrate-add-regions.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// Migration function for Fleet collection
async function migrateFleets() {
  try {
    const Fleet = mongoose.model(
      "Fleet",
      new mongoose.Schema({}, { strict: false })
    );

    // Find all fleets without region field
    const fleetsToUpdate = await Fleet.find({
      $or: [{ region: { $exists: false } }, { currency: { $exists: false } }],
    });

    console.log(`\n📊 Found ${fleetsToUpdate.length} fleets to update`);

    if (fleetsToUpdate.length === 0) {
      console.log("✅ All fleets already have region and currency fields");
      return;
    }

    // Update each fleet
    const result = await Fleet.updateMany(
      {
        $or: [
          { region: { $exists: false } },
          { currency: { $exists: false } },
        ],
      },
      {
        $set: {
          region: "US",
          currency: "USD",
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} fleet documents`);
    console.log(`   - Region: US`);
    console.log(`   - Currency: USD`);
  } catch (error) {
    console.error("❌ Error migrating fleets:", error);
    throw error;
  }
}

// Migration function for Booking collection
async function migrateBookings() {
  try {
    const Booking = mongoose.model(
      "Booking",
      new mongoose.Schema({}, { strict: false })
    );

    // Find all bookings without customerRegion field
    const bookingsToUpdate = await Booking.find({
      $or: [
        { customerRegion: { $exists: false } },
        { currency: { $exists: false } },
      ],
    });

    console.log(`\n📊 Found ${bookingsToUpdate.length} bookings to update`);

    if (bookingsToUpdate.length === 0) {
      console.log(
        "✅ All bookings already have customerRegion and currency fields"
      );
      return;
    }

    // Update each booking
    const result = await Booking.updateMany(
      {
        $or: [
          { customerRegion: { $exists: false } },
          { currency: { $exists: false } },
        ],
      },
      {
        $set: {
          customerRegion: "US",
          currency: "USD",
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} booking documents`);
    console.log(`   - Customer Region: US`);
    console.log(`   - Currency: USD`);
  } catch (error) {
    console.error("❌ Error migrating bookings:", error);
    throw error;
  }
}

// Verification function
async function verifyMigration() {
  try {
    const Fleet = mongoose.model(
      "Fleet",
      new mongoose.Schema({}, { strict: false })
    );
    const Booking = mongoose.model(
      "Booking",
      new mongoose.Schema({}, { strict: false })
    );

    console.log("\n🔍 Verifying migration...");

    // Check fleets
    const totalFleets = await Fleet.countDocuments();
    const fleetsWithRegion = await Fleet.countDocuments({
      region: { $exists: true },
      currency: { $exists: true },
    });

    console.log(`\nFleets:`);
    console.log(`   Total: ${totalFleets}`);
    console.log(`   With region/currency: ${fleetsWithRegion}`);
    console.log(
      `   ${fleetsWithRegion === totalFleets ? "✅" : "❌"} Migration complete`
    );

    // Check bookings
    const totalBookings = await Booking.countDocuments();
    const bookingsWithRegion = await Booking.countDocuments({
      customerRegion: { $exists: true },
      currency: { $exists: true },
    });

    console.log(`\nBookings:`);
    console.log(`   Total: ${totalBookings}`);
    console.log(`   With customerRegion/currency: ${bookingsWithRegion}`);
    console.log(
      `   ${bookingsWithRegion === totalBookings ? "✅" : "❌"} Migration complete`
    );

    // Show some sample data
    console.log("\n📋 Sample fleet data:");
    const sampleFleet = await Fleet.findOne({ region: { $exists: true } }).lean();
    if (sampleFleet) {
      console.log(`   Business: ${sampleFleet.businessName}`);
      console.log(`   Region: ${sampleFleet.region}`);
      console.log(`   Currency: ${sampleFleet.currency}`);
    }

    console.log("\n📋 Sample booking data:");
    const sampleBooking = await Booking.findOne({
      customerRegion: { $exists: true },
    }).lean();
    if (sampleBooking) {
      console.log(`   Booking ID: ${sampleBooking._id}`);
      console.log(`   Customer Region: ${sampleBooking.customerRegion}`);
      console.log(`   Currency: ${sampleBooking.currency}`);
      console.log(`   Price: ${sampleBooking.price}`);
    }
  } catch (error) {
    console.error("❌ Error verifying migration:", error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting multi-region migration...\n");

  try {
    await connectDB();
    await migrateFleets();
    await migrateBookings();
    await verifyMigration();

    console.log("\n✅ Migration completed successfully!");
    console.log(
      "\n📝 Note: All existing data has been set to US region with USD currency."
    );
    console.log(
      "   New signups will be automatically assigned their detected region.\n"
    );
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the migration
main();
