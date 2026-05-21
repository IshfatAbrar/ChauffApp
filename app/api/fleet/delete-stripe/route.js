import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Fleet from "../../../../lib/models/fleet.model";
import { connectMongoDB } from "../../../../lib/mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const fleet = await Fleet.findOne({ email: session.user.email });

    if (!fleet) {
      return NextResponse.json({ message: "Fleet not found" }, { status: 404 });
    }

    const log = [];
    log.push(`Fleet: ${fleet.businessName} (${fleet.email})`);

    // Check if fleet has existing Stripe account
    if (fleet.stripeAccountID) {
      log.push(`Current Stripe Account ID: ${fleet.stripeAccountID}`);

      try {
        // Delete the Stripe account
        log.push("Deleting Stripe account from Stripe...");
        await stripe.accounts.del(fleet.stripeAccountID);
        log.push("✅ Stripe account deleted from Stripe");
      } catch (error) {
        if (error.code === "resource_missing") {
          log.push("⚠️ Stripe account not found in Stripe (may already be deleted)");
        } else {
          log.push(`❌ Error deleting from Stripe: ${error.message}`);
          throw error;
        }
      }

      // Clear Stripe account data from database
      fleet.stripeAccountID = undefined;
      fleet.stripeAccountVerified = false;
      await fleet.save();
      log.push("✅ Stripe account data cleared from database");
    } else {
      log.push("No Stripe account found in database");
    }

    return NextResponse.json({
      success: true,
      message: "Stripe account deleted successfully",
      log,
    });
  } catch (error) {
    console.error("Error deleting Stripe account:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete Stripe account",
        error: error.toString(),
      },
      { status: 500 }
    );
  }
}





