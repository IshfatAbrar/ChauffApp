import { NextResponse } from "next/server";
import { connectMongoDB } from "../../../lib/mongodb";
import Booking from "../../../lib/models/booking.model";
import { getStripeInstance } from "../../../lib/utils/stripe";

export async function POST(request: Request) {
  try {
    const {
      amount,
      currency,
      customerId,
      paymentMethodId,
      metadata,
      bookingId,
      customerRegion, // Customer's region determines which Stripe account to use
    } = await request.json();

    if (!amount || !customerId || !paymentMethodId || !bookingId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: amount, customerId, paymentMethodId, bookingId",
        },
        { status: 400 }
      );
    }

    // Find Booking -> Chauffeur -> Fleet so we can create a destination charge
    await connectMongoDB();
    const booking = await Booking.findById(bookingId).populate({
      path: "chauffeur",
      populate: { path: "fleet", model: "Fleet" },
    });

    // Use customer's region to determine which Stripe account to use
    const region = customerRegion || booking.customerRegion || "US";
    const stripe = getStripeInstance(region);
    const bookingCurrency = (currency || booking.currency || "usd").toLowerCase();

    console.log(`💳 Creating payment intent in region: ${region} (${bookingCurrency.toUpperCase()})`);

    const PLATFORM_FEE_PERCENTAGE = parseFloat(
      process.env.PLATFORM_FEE_PERCENTAGE || "0.10"
    );
    const amountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE);

    // Create a PaymentIntent with capture_method: 'manual' for authorization hold
    const paymentIntentParams = {
      amount: amountCents, // Convert dollars to cents
      currency: bookingCurrency,
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: "manual" as const, // This creates an authorization hold instead of immediate charge
      confirm: true, // Immediately confirm the payment intent
      // Helpful for debugging/traceability
      transfer_group: `booking_${bookingId}`,
      metadata: { ...(metadata || {}), bookingId },
      off_session: true, // Allow charging without customer present
      // Note: return_url not needed since we're using off_session and not allowing redirects
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Check if the authorization was successful
    if (paymentIntent.status === "requires_capture") {
      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        platformFee: platformFeeCents / 100,
        destination: null,
        message: "Payment authorization successful. Funds are on hold.",
      });
    } else if (paymentIntent.status === "requires_action") {
      // Card requires additional authentication (3D Secure)
      return NextResponse.json({
        success: false,
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        message: "Additional authentication required",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Unexpected payment status: ${paymentIntent.status}`,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create payment authorization",
      },
      { status: 500 }
    );
  }
}

