import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
  apiVersion: "2024-06-20",
});

export async function POST(request: any) {
  const data = await request.json();
  const email = data.email;

  try {
    let customer;

    // Check if a customer with the given email already exists
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      // Use the existing customer
      console.log("Customer found:", customers.data[0].id);
      customer = customers.data[0];
    } else {
      // Create a new customer if none exists
      console.log("No existing customer found, creating a new customer");
      customer = await stripe.customers.create({ email });
    }

    // Create a setup intent for the customer
    console.log("Creating setup intent for customer:", customer.id);
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
    });

    console.log("Setup intent created:", setupIntent.id);

    return NextResponse.json({ client_secret: setupIntent.client_secret });
  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
}
