import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { checkFleetStripeStatus } from "../../../../../lib/controllers/fleet.stripe.controller";
import Fleet from "../../../../../lib/models/fleet.model";
import { connectMongoDB } from "../../../../../lib/mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    // Use lean() to bypass Mongoose cache and get fresh data from DB
    const fleet = await Fleet.findOne({ email: session.user.email }).lean();

    if (!fleet) {
        return NextResponse.json({ message: "Fleet profile not found" }, { status: 404 });
    }

    console.log("Fleet found:", fleet._id);
    console.log("Fleet stripeAccountID:", fleet.stripeAccountID);

    const result = await checkFleetStripeStatus(fleet._id);

    console.log("API Response - Fleet Stripe Status:", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

