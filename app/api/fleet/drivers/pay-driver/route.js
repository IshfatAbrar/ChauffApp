import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import Fleet from "../../../../../lib/models/fleet.model";
import Driver from "../../../../../lib/models/driver.model";
import Booking from "../../../../../lib/models/booking.model";
import { connectMongoDB } from "../../../../../lib/mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { driverId } = await req.json();

    if (!driverId) {
      return NextResponse.json(
        { message: "Driver ID is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Get fleet
    const fleet = await Fleet.findOne({ email: session.user.email });
    if (!fleet) {
      return NextResponse.json({ message: "Fleet not found" }, { status: 404 });
    }

    const fleetStripeReady = !!(fleet.stripeAccountID && fleet.stripeAccountVerified);

    // Get driver
    const driver = await Driver.findOne({ _id: driverId, fleet: fleet._id });
    if (!driver) {
      return NextResponse.json(
        { message: "Driver not found or doesn't belong to this fleet" },
        { status: 404 }
      );
    }

    // Some older/test driver records may be missing a license number, but the schema requires it.
    // Ensure we set a unique placeholder so payouts don't fail validation.
    if (!driver.licenseNumber || String(driver.licenseNumber).trim().length === 0) {
      driver.licenseNumber = `TEMP-${driver._id.toString().slice(-8)}`;
    }

    // Check if driver has bank details (manual payout mode)
    if (!driver.bankDetails?.accountNumber) {
      return NextResponse.json(
        { message: "Driver bank details not configured" },
        { status: 400 }
      );
    }

    // Get completed rides that need to be paid by fleet (same criteria as calculate-payout)
    const completedBookings = await Booking.find({
      chauffeur: driverId,
      status: "completed",
      fleetPaidToDriver: { $ne: true },
      "payment.status": { $nin: ["failed", "refunded"] },
    });

    // Compute amount due server-side (do not trust client input)
    const paymentSettings = fleet.driverPaymentSettings || {
      paymentType: "percentage_per_ride",
      percentagePerRide: 90,
    };

    let amount = 0;
    if (paymentSettings.paymentType === "fixed_monthly") {
      amount = Number(paymentSettings.fixedMonthlyAmount || 0);
    } else if (paymentSettings.paymentType === "fixed_per_ride") {
      const perRide = Number(paymentSettings.fixedPerRideAmount || 0);
      amount = completedBookings.length * perRide;
    } else {
      const pct = Number(paymentSettings.percentagePerRide ?? 90);
      amount = completedBookings.reduce(
        (sum, b) => sum + (Number(b.price || 0) * pct) / 100,
        0
      );
    }

    amount = Math.round(amount * 100) / 100;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "No payout is currently due for this driver" },
        { status: 400 }
      );
    }

    try {
      let payout = null;
      let payoutMode = "manual";

      // If the fleet has a verified Stripe Connect account AND this driver has a Stripe external bank account id,
      // attempt a real Stripe payout. Otherwise, record as manual payout (so the UI + accounting still works).
      if (fleetStripeReady && driver.bankAccountID) {
        payoutMode = "stripe";
        payout = await stripe.payouts.create(
          {
            amount: Math.round(amount * 100), // Convert to cents
            currency: "aud",
            destination: driver.bankAccountID,
            method: "standard",
          },
          {
            stripeAccount: fleet.stripeAccountID,
          }
        );
      }

      // Alternative: If not using Stripe Connect for drivers, use bank transfer
      // For now, we'll mark bookings as paid and track the payment
      // In production, you'd integrate with a payment processor or banking API

      // Mark bookings as paid
      await Booking.updateMany(
        {
          chauffeur: driverId,
          status: "completed",
          fleetPaidToDriver: { $ne: true },
          "payment.status": { $nin: ["failed", "refunded"] },
        },
        {
          fleetPaidToDriver: true,
          fleetPaidAt: new Date(),
          fleetPaidAmount: amount,
        }
      );

      // Record payment in driver's transaction history
      const paymentRecord = {
        // For schema validation, attach the transaction to a representative booking.
        // If there are multiple bookings, we use the first unpaid one.
        bookingId: completedBookings?.[0]?._id,
        paymentIntentId: `fleet_payout_${Date.now()}`,
        grossAmount: amount,
        netAmount: amount,
        platformFee: 0,
        stripeFee: 0,
        status: "completed",
        date: new Date(),
        metadata: {
          type: "fleet_payout",
          fleetId: fleet._id.toString(),
          paidBookingsCount: completedBookings.length,
        },
      };

      // Only push a transaction if we have at least one booking to attach it to.
      // (Fixed-monthly payouts with zero rides would otherwise violate required bookingId.)
      if (paymentRecord.bookingId) {
        driver.transactions.push(paymentRecord);
      }
      driver.balance = (driver.balance || 0) + amount;
      await driver.save();

      return NextResponse.json({
        success: true,
        message:
          payoutMode === "stripe"
            ? `Stripe payout of $${amount.toFixed(2)} processed successfully`
            : `Payout of $${amount.toFixed(2)} recorded (manual payout mode)`,
        payoutMode,
        payoutId: payout?.id || "manual",
        paidBookingsCount: completedBookings.length,
        driverBalance: driver.balance,
      });
    } catch (stripeError) {
      console.error("Stripe payout error:", stripeError);

      // If Stripe payout fails, we can still mark as paid manually
      // (for testing or if using alternative payment methods)
      // Always allow falling back to manual recording so the fleet can pay externally (bank transfer, etc.)
      await Booking.updateMany(
        {
          chauffeur: driverId,
          status: "completed",
          fleetPaidToDriver: { $ne: true },
          "payment.status": { $nin: ["failed", "refunded"] },
        },
        {
          fleetPaidToDriver: true,
          fleetPaidAt: new Date(),
          fleetPaidAmount: amount,
        }
      );

      driver.balance = (driver.balance || 0) + amount;
      await driver.save();

      return NextResponse.json({
        success: true,
        message: `Payout of $${amount.toFixed(2)} recorded (manual payout mode)`,
        warning: `Stripe payout failed (${stripeError.message}). Marked as paid so you can pay the driver externally using their bank details.`,
        paidBookingsCount: completedBookings.length,
      });
    }
  } catch (error) {
    console.error("Error paying driver:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

