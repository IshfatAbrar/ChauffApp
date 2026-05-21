import { NextResponse } from "next/server";
import { connectMongoDB } from "../../../lib/mongodb";
import Booking from "../../../lib/models/booking.model";
import { getStripeInstance } from "../../../lib/utils/stripe";

// Platform fee percentage (default 10%)
const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "0.10");

export async function POST(request: Request) {
  try {
    const { paymentIntentId, finalAmount, bookingId } = await request.json();

    console.log("=== CAPTURE PAYMENT START ===");
    console.log("Payment Intent ID:", paymentIntentId);
    console.log("Final Amount:", finalAmount);
    console.log("Booking ID:", bookingId);

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectMongoDB();

    // Get booking details
    const booking = await Booking.findById(bookingId).populate({
      path: "chauffeur",
      populate: {
        path: "fleet",
        model: "Fleet",
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log("Booking found:", booking._id);
    console.log("Chauffeur:", booking.chauffeur?._id);

    // Use customer's region to get correct Stripe instance
    const region = booking.customerRegion || "US";
    const stripe = getStripeInstance(region);
    
    console.log(`💰 Capturing payment in region: ${region} (${booking.currency || "USD"})`);

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "requires_capture") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be captured. Current status: ${paymentIntent.status}`,
        },
        { status: 400 }
      );
    }

    const fleet = booking?.chauffeur?.fleet as any;
    if (!fleet?.stripeAccountID) {
      return NextResponse.json(
        { error: "Fleet Stripe account not configured for this booking" },
        { status: 400 }
      );
    }
    if (!fleet?.stripeAccountVerified) {
      return NextResponse.json(
        { error: "Fleet Stripe account not verified" },
        { status: 400 }
      );
    }

    // Determine capture amount
    let captureAmount = paymentIntent.amount;
    if (finalAmount) {
      const finalAmountCents = Math.round(finalAmount * 100);
      // Can only capture up to the authorized amount
      if (finalAmountCents > paymentIntent.amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Final amount ($${finalAmount}) exceeds authorized amount ($${paymentIntent.amount / 100})`,
          },
          { status: 400 }
        );
      }
      captureAmount = finalAmountCents;
    }

    const captureAmountDollars = captureAmount / 100;
    console.log("Capturing amount:", captureAmountDollars);

    // STEP 1: Capture the payment from customer
    console.log("Step 1: Capturing payment...");
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: captureAmount,
    });

    console.log("✅ Payment captured successfully");
    console.log("Amount captured:", capturedPayment.amount_received / 100);

    const platformFeeCents = Math.round(captureAmount * PLATFORM_FEE_PERCENTAGE);
    const platformFee = platformFeeCents / 100;
    const fleetAmountCents = captureAmount - platformFeeCents;
    const fleetAmount = fleetAmountCents / 100;

    if (fleetAmountCents <= 0) {
      return NextResponse.json(
        { error: "Calculated fleet payout amount is not valid" },
        { status: 400 }
      );
    }

    let transferId: string | null = null;
    let transferStatus: "completed" | "failed" = "completed";
    let transferFailureReason: string | undefined;

    try {
      const transfer = await stripe.transfers.create({
        amount: fleetAmountCents,
        currency: paymentIntent.currency,
        destination: fleet.stripeAccountID,
        transfer_group: `booking_${bookingId}`,
      });
      transferId = transfer.id;
    } catch (transferError: any) {
      transferStatus = "failed";
      transferFailureReason =
        transferError?.message || "Failed to transfer funds to fleet";
    }

    // STEP 3: Update booking in database
    console.log("Step 3: Updating booking...");
    await Booking.findByIdAndUpdate(bookingId, {
      "payment.paymentIntentId": paymentIntentId,
      "payment.transferId": transferId,
      "payment.transferStatus": transferStatus,
      "payment.transferFailureReason": transferFailureReason,
      "payment.status": "completed",
      "payment.processedAt": new Date(),
      // Stripe fees are not explicitly tracked here; keep as 0 for now
      "payment.stripeFee": 0,
      "payment.platformFee": platformFee,
      "payment.driverAmount": fleetAmount, // legacy field name; represents fleet amount
      price: captureAmountDollars, // Update actual charged amount
      status: "completed", // Update booking status
    });

    console.log("✅ Booking updated successfully");
    console.log("=== CAPTURE PAYMENT COMPLETE ===");

    if (transferStatus === "failed") {
      return NextResponse.json(
        {
          success: false,
          paymentCaptured: true,
          paymentIntentId: capturedPayment.id,
          transferId,
          status: capturedPayment.status,
          amountCaptured: captureAmountDollars,
          platformFee: platformFee,
          fleetAmount: fleetAmount,
          error: transferFailureReason,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: capturedPayment.id,
      transferId,
      status: capturedPayment.status,
      amountCaptured: captureAmountDollars,
      platformFee: platformFee,
      fleetAmount: fleetAmount,
      message: `Payment of $${captureAmountDollars.toFixed(
        2
      )} captured successfully. $${fleetAmount.toFixed(
        2
      )} transferred to fleet after platform fee.`,
    });
  } catch (error: any) {
    console.error("❌ Error capturing payment:", error);
    console.error("Error details:", error.message);
    
    // Update booking to failed status
    try {
      const { bookingId } = await request.json();
      if (bookingId) {
        await connectMongoDB();
        await Booking.findByIdAndUpdate(bookingId, {
          "payment.status": "failed",
          "payment.failureReason": error.message,
        });
      }
    } catch (dbError) {
      console.error("Error updating booking:", dbError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to capture payment",
      },
      { status: 500 }
    );
  }
}

