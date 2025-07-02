import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
  apiVersion: "2024-06-20",
});

export async function POST(request: any) {
  const { id } = await request.json(); // Get the payment method ID from the request body

  try {
    // Detach the payment method
    const detachedPaymentMethod = await stripe.paymentMethods.detach(id);

    return NextResponse.json({ success: true, detachedPaymentMethod });
  } catch (error: any) {
    console.error("Error detaching payment method:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
}
