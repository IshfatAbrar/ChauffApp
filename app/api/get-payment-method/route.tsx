import { NextResponse } from "next/server";
import { getStripeInstance } from "../../../lib/utils/stripe";

export async function POST(request: any) {
  const { email, region } = await request.json();

  try {
    // Use customer's region to get correct Stripe instance
    const customerRegion = region || "US";
    const stripe = getStripeInstance(customerRegion);

    console.log(`💳 Getting payment method for region: ${customerRegion}`);

    // Find customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ paymentMethod: null });
    }

    const customerId = customers.data[0].id;
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    console.log("Payment methods:", paymentMethods);

    const paymentMethod = paymentMethods.data[0] || null;

    return NextResponse.json({ paymentMethod });
  } catch (error: any) {
    console.error("Error fetching payment method:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
}
