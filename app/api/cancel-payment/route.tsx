import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectMongoDB } from "../../../lib/mongodb";
import Booking from "../../../lib/models/booking.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
  apiVersion: "2024-06-20",
});

export async function POST(request: Request) {
  try {
    const { paymentIntentId, bookingId, cancelReason } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Only cancel if it's in a cancellable state
    if (paymentIntent.status === "requires_capture") {
      // Cancel the payment intent (releases the hold)
      const cancelledPayment = await stripe.paymentIntents.cancel(paymentIntentId);

      // Update booking in database if bookingId is provided
      if (bookingId) {
        await connectMongoDB();
        await Booking.findByIdAndUpdate(bookingId, {
          "payment.status": "refunded",
          "payment.refundedAt": new Date(),
          "payment.failureReason": cancelReason || "Ride cancelled",
        });
      }

      return NextResponse.json({
        success: true,
        paymentIntentId: cancelledPayment.id,
        status: cancelledPayment.status,
        message: "Payment authorization released successfully",
      });
    } else if (paymentIntent.status === "succeeded") {
      // If already captured, need to create a refund instead
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Update booking in database
      if (bookingId) {
        await connectMongoDB();
        await Booking.findByIdAndUpdate(bookingId, {
          "payment.status": "refunded",
          "payment.refundedAt": new Date(),
          "payment.refundAmount": refund.amount / 100,
          "payment.failureReason": cancelReason || "Ride cancelled - refunded",
        });
      }

      return NextResponse.json({
        success: true,
        refundId: refund.id,
        status: refund.status,
        amountRefunded: refund.amount / 100,
        message: "Payment refunded successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be cancelled. Current status: ${paymentIntent.status}`,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error cancelling payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to cancel payment",
      },
      { status: 500 }
    );
  }
}



