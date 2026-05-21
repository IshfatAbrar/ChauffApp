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

    const fleetId = session.user?.fleetId || session.user?.id;

    if (!fleetId) {
      return NextResponse.json(
        { message: "Fleet ID not found in session" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const fleet = await Fleet.findById(fleetId);

    if (!fleet) {
      return NextResponse.json({ message: "Fleet not found" }, { status: 404 });
    }

    const log = [];
    log.push(`Fleet: ${fleet.businessName} (${fleet.email})`);

    // Check if fleet has existing Stripe account
    if (fleet.stripeAccountID) {
      log.push(`Current Stripe Account ID: ${fleet.stripeAccountID}`);

      try {
        const existingAccount = await stripe.accounts.retrieve(
          fleet.stripeAccountID
        );
        log.push(`Current account country: ${existingAccount.country}`);

        if (existingAccount.country === "US") {
          return NextResponse.json({
            success: false,
            message: "Account is already set to US. No reset needed.",
            log,
          });
        }

        // Delete old account
        log.push("Deleting old Stripe account...");
        await stripe.accounts.del(fleet.stripeAccountID);
        log.push("✅ Old account deleted");
      } catch (error) {
        if (error.code === "resource_missing") {
          log.push("⚠️ Stripe account not found (already deleted)");
        } else {
          throw error;
        }
      }
    } else {
      log.push("No existing Stripe account found");
    }

    // Create new US-based account
    log.push("Creating new US-based Stripe account...");
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

    log.push(`✅ New Stripe account created: ${newAccount.id}`);
    log.push(`Country: ${newAccount.country}`);
    log.push(`Currency: ${newAccount.default_currency}`);

    // Update database
    fleet.stripeAccountID = newAccount.id;
    fleet.stripeAccountVerified = false; // Needs to complete onboarding again
    await fleet.save();
    log.push("✅ Database updated");

    return NextResponse.json({
      success: true,
      message: "Stripe account successfully reset to US",
      newAccountId: newAccount.id,
      country: newAccount.country,
      currency: newAccount.default_currency,
      nextSteps: [
        "Go to /fleet/payments",
        "Click 'Complete Setup' or 'Connect with Stripe'",
        "Complete the US-based onboarding form",
        "Use US bank details (routing number + account number)",
        "Submit and verify",
      ],
      log,
    });
  } catch (error) {
    console.error("Error resetting Stripe account:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to reset Stripe account",
        error: error.toString(),
      },
      { status: 500 }
    );
  }
}



