import { NextResponse } from "next/server";
import { getStripeInstance } from "../../../lib/utils/stripe";

export async function POST(request: any) {
  const { email, region } = await request.json();

  if (!email) {
    return new NextResponse(JSON.stringify({ error: "Email is required" }), {
      status: 400,
    });
  }

  try {
    // Use customer's region to get correct Stripe instance
    const customerRegion = region || "US";
    const stripe = getStripeInstance(customerRegion);
    
    console.log(`👤 Getting/creating customer in region: ${customerRegion}`);

    // Find customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      // Create customer if doesn't exist
      const customer = await stripe.customers.create({
        email,
        metadata: {
          created_by: "chauff_booking_system",
        },
      });

      return NextResponse.json({
        customerId: customer.id,
        isNewCustomer: true,
      });
    }

    const customerId = customers.data[0].id;

    return NextResponse.json({
      customerId,
      isNewCustomer: false,
    });
  } catch (error: any) {
    console.error("Error fetching/creating customer:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
