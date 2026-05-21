import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import Fleet from "../../../../lib/models/fleet.model";
import { connectMongoDB } from "../../../../lib/mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
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

    const response = {
      fleetId: fleet._id,
      businessName: fleet.businessName,
      email: fleet.email,
      database: {
        stripeAccountID: fleet.stripeAccountID || null,
        stripeAccountVerified: fleet.stripeAccountVerified || false,
        isActive: fleet.isActive || false,
      },
      stripe: null,
      canReceiveTransfers: false,
      issues: [],
    };

    if (!fleet.stripeAccountID) {
      response.issues.push(
        "No Stripe account connected. Please connect at /fleet/payments"
      );
      return NextResponse.json(response);
    }

    try {
      const account = await stripe.accounts.retrieve(fleet.stripeAccountID);

      response.stripe = {
        accountID: account.id,
        country: account.country,
        currency: account.default_currency,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          pastDue: account.requirements?.past_due || [],
        },
      };

      const isVerified = account.charges_enabled && account.payouts_enabled;
      response.canReceiveTransfers = isVerified;

      // Update database if needed
      if (fleet.stripeAccountVerified !== isVerified) {
        fleet.stripeAccountVerified = isVerified;
        await fleet.save();
        response.database.stripeAccountVerified = isVerified;
        response.issues.push("Database verification status updated");
      }

      if (!isVerified) {
        if (!account.charges_enabled) {
          response.issues.push(
            "Charges not enabled - complete Stripe onboarding"
          );
        }
        if (!account.payouts_enabled) {
          response.issues.push(
            "Payouts not enabled - complete Stripe onboarding"
          );
        }
        if (account.requirements?.currently_due?.length > 0) {
          response.issues.push(
            `Missing requirements: ${account.requirements.currently_due.join(
              ", "
            )}`
          );
        }
      }
    } catch (stripeError) {
      response.issues.push(`Stripe Error: ${stripeError.message}`);
      if (stripeError.code === "resource_missing") {
        response.issues.push(
          "Stripe account not found - may have been deleted"
        );
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking fleet status:", error);
    return NextResponse.json(
      { message: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
