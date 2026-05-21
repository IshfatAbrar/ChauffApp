import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import Fleet from "../../../../../lib/models/fleet.model";
import Driver from "../../../../../lib/models/driver.model";
import Booking from "../../../../../lib/models/booking.model";
import { connectMongoDB } from "../../../../../lib/mongodb";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "fleet") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { driverId } = await req.json();

    await connectMongoDB();

    // Get fleet
    const fleet = await Fleet.findOne({ email: session.user.email });
    if (!fleet) {
      return NextResponse.json({ message: "Fleet not found" }, { status: 404 });
    }

    // Get driver
    const driver = await Driver.findOne({ _id: driverId, fleet: fleet._id });
    if (!driver) {
      return NextResponse.json(
        { message: "Driver not found or doesn't belong to this fleet" },
        { status: 404 }
      );
    }

    // Get fleet payment settings
    const paymentSettings = fleet.driverPaymentSettings || {
      paymentType: "percentage_per_ride",
      percentagePerRide: 90,
    };

    // Get all completed rides for this driver that haven't been paid by the fleet yet.
    // Note: We intentionally do NOT require payment.status === "completed" here, because
    // many fleets want to see what's due based on ride completion even if the customer
    // payment is still processing. We exclude failed/refunded payments.
    const completedBookings = await Booking.find({
      chauffeur: driverId,
      status: "completed",
      fleetPaidToDriver: { $ne: true }, // Not yet paid by fleet
      "payment.status": { $nin: ["failed", "refunded"] },
    }).sort({ updatedAt: -1 });

    let totalDue = 0;
    const bookingBreakdown = [];

    // Calculate what's due based on payment type
    if (paymentSettings.paymentType === "fixed_monthly") {
      // For fixed monthly, calculate based on current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const bookingsThisMonth = completedBookings.filter((booking) => {
        const completedDate = new Date(booking.updatedAt || booking.createdAt);
        return completedDate >= startOfMonth && completedDate <= endOfMonth;
      });

      totalDue = paymentSettings.fixedMonthlyAmount || 0;
      bookingBreakdown.push({
        period: "Current Month",
        count: bookingsThisMonth.length,
        amount: totalDue,
        type: "fixed_monthly",
      });
    } else if (paymentSettings.paymentType === "fixed_per_ride") {
      // Fixed amount per ride
      const amountPerRide = paymentSettings.fixedPerRideAmount || 0;
      totalDue = completedBookings.length * amountPerRide;

      completedBookings.forEach((booking) => {
        bookingBreakdown.push({
          bookingId: booking._id,
          date: booking.updatedAt || booking.createdAt,
          paymentStatus: booking.payment?.status,
          amount: amountPerRide,
          type: "fixed_per_ride",
        });
      });
    } else if (paymentSettings.paymentType === "percentage_per_ride") {
      // Percentage of each ride
      const percentage = paymentSettings.percentagePerRide || 90;

      completedBookings.forEach((booking) => {
        const driverAmount = (booking.price * percentage) / 100;
        totalDue += driverAmount;
        bookingBreakdown.push({
          bookingId: booking._id,
          date: booking.updatedAt || booking.createdAt,
          ridePrice: booking.price,
          paymentStatus: booking.payment?.status,
          percentage: percentage,
          amount: driverAmount,
          type: "percentage_per_ride",
        });
      });
    }

    const countsByPaymentStatus = completedBookings.reduce((acc, b) => {
      const s = b.payment?.status || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      driverId: driverId,
      driverName: driver.name,
      paymentSettings: paymentSettings,
      totalDue: Math.round(totalDue * 100) / 100, // Round to 2 decimal places
      unpaidBookingsCount: completedBookings.length,
      countsByPaymentStatus,
      bookingBreakdown: bookingBreakdown,
      hasBankDetails: !!(
        driver.bankDetails?.accountNumber
      ),
    });
  } catch (error) {
    console.error("Error calculating driver payout:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

