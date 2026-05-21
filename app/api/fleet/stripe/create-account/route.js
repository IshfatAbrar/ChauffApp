import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { createFleetStripeAccount } from "../../../../../lib/controllers/fleet.stripe.controller";
import Fleet from "../../../../../lib/models/fleet.model";
import { connectMongoDB } from "../../../../../lib/mongodb";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // We need to get the actual Fleet ID from the session or database using the email
    await connectMongoDB();
    const fleet = await Fleet.findOne({ email: session.user.email });
    
    if (!fleet) {
        return NextResponse.json({ message: "Fleet profile not found" }, { status: 404 });
    }

    const result = await createFleetStripeAccount(fleet._id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

