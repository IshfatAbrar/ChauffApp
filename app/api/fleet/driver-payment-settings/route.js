import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import Fleet from "../../../../lib/models/fleet.model";
import { connectMongoDB } from "../../../../lib/mongodb";

// GET: Fetch driver payment settings
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const fleet = await Fleet.findOne({ email: session.user.email }).select(
      "driverPaymentSettings"
    );

    if (!fleet) {
      return NextResponse.json(
        { message: "Fleet profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: fleet.driverPaymentSettings || {
        paymentType: "percentage_per_ride",
        percentagePerRide: 90,
      },
    });
  } catch (error) {
    console.error("Error fetching driver payment settings:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT: Update driver payment settings
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentType, fixedMonthlyAmount, fixedPerRideAmount, percentagePerRide } = body;

    // Validate payment type
    const validPaymentTypes = ["fixed_monthly", "fixed_per_ride", "percentage_per_ride"];
    if (!validPaymentTypes.includes(paymentType)) {
      return NextResponse.json(
        { message: "Invalid payment type" },
        { status: 400 }
      );
    }

    // Validate based on payment type
    if (paymentType === "fixed_monthly" && (!fixedMonthlyAmount || fixedMonthlyAmount < 0)) {
      return NextResponse.json(
        { message: "Fixed monthly amount must be a positive number" },
        { status: 400 }
      );
    }

    if (paymentType === "fixed_per_ride" && (!fixedPerRideAmount || fixedPerRideAmount < 0)) {
      return NextResponse.json(
        { message: "Fixed per ride amount must be a positive number" },
        { status: 400 }
      );
    }

    if (paymentType === "percentage_per_ride") {
      if (!percentagePerRide || percentagePerRide < 0 || percentagePerRide > 100) {
        return NextResponse.json(
          { message: "Percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    await connectMongoDB();
    const fleet = await Fleet.findOne({ email: session.user.email });

    if (!fleet) {
      return NextResponse.json(
        { message: "Fleet profile not found" },
        { status: 404 }
      );
    }

    // Update driver payment settings
    fleet.driverPaymentSettings = {
      paymentType,
      fixedMonthlyAmount: paymentType === "fixed_monthly" ? fixedMonthlyAmount : undefined,
      fixedPerRideAmount: paymentType === "fixed_per_ride" ? fixedPerRideAmount : undefined,
      percentagePerRide: paymentType === "percentage_per_ride" ? percentagePerRide : undefined,
    };

    await fleet.save();

    return NextResponse.json({
      success: true,
      message: "Driver payment settings updated successfully",
      settings: fleet.driverPaymentSettings,
    });
  } catch (error) {
    console.error("Error updating driver payment settings:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

