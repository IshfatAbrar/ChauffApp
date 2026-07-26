import { NextResponse } from "next/server";
import Booking from "../../../../../lib/models/booking.model";
import { connectMongoDB } from "../../../../../lib/mongodb";
import {
  deleteBooking,
  updateBookingPaymentIntent,
} from "../../../../../lib/actions/booking.actions";
import {
  getCustomerFromRequest,
  unauthorized,
} from "../../../../../lib/utils/customerAuth";

function serializeBooking(booking) {
  const stopover =
    booking.stopoverLocation?.map((stop) => stop?.name).filter(Boolean) || [];
  const rawId = booking._id || booking.id;

  return {
    id: rawId?.toString?.() || String(rawId),
    status: booking.status,
    pickup: booking.pickupLocation?.name,
    dropoff: booking.dropoffLocation?.name,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    stopover,
    stopoverLocation: booking.stopoverLocation || [],
    price: booking.price,
    currency: booking.currency || "USD",
    customerRegion: booking.customerRegion || "US",
    selectedCar: booking.selectedCar,
    time: booking.time,
    duration: booking.duration,
    distance: booking.distance,
    toll: booking.toll || 0,
    notes: booking.notes || "",
    detailedLocation: booking.detailedLocation || "",
    phoneNumber: booking.phoneNumber,
    paymentStatus: booking.payment?.status || "pending",
    timeline: booking.timeline || null,
    chauffeur: booking.chauffeur
      ? {
          id: booking.chauffeur._id?.toString?.() || booking.chauffeur.toString(),
          name: booking.chauffeur.name,
          phone: booking.chauffeur.phone,
        }
      : null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export async function GET(request, { params }) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    await connectMongoDB();
    const booking = await Booking.findById(params.id)
      .populate("chauffeur", "name phone")
      .lean();

    if (!booking || booking.email !== customer.email) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking: serializeBooking(booking) });
  } catch (error) {
    console.error("Customer booking detail error:", error);
    return NextResponse.json(
      { message: "Failed to fetch booking." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    const body = await request.json();
    await connectMongoDB();
    const booking = await Booking.findById(params.id);

    if (!booking || booking.email !== customer.email) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    if (body.paymentIntentId) {
      const updated = await updateBookingPaymentIntent(
        params.id,
        body.paymentIntentId
      );
      return NextResponse.json({ booking: serializeBooking(updated) });
    }

    return NextResponse.json(
      { message: "No valid fields to update." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Customer booking update error:", error);
    return NextResponse.json(
      { message: "Failed to update booking." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    await connectMongoDB();
    const booking = await Booking.findById(params.id);

    if (!booking || booking.email !== customer.email) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    if (booking.status !== "requested") {
      return NextResponse.json(
        { message: "Only requested bookings can be cancelled." },
        { status: 400 }
      );
    }

    await deleteBooking(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer cancel booking error:", error);
    return NextResponse.json(
      { message: "Failed to cancel booking." },
      { status: 500 }
    );
  }
}
